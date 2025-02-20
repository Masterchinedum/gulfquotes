"use client";

// Add Tag to the imports from @prisma/client
import { Category, AuthorProfile, Tag } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuoteSchema, CreateQuoteInput } from "@/schemas/quote";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils";
import { ImageGallery } from "@/components/quotes/image-gallery";
import type { CloudinaryUploadResult, QuoteImageResource } from "@/types/cloudinary";
import type { GalleryItem } from "@/types/gallery";
import { CldImage } from "next-cloudinary";
import { TagInput } from "@/components/forms/TagInput";
import { TagManagementModal } from "@/components/forms/TagManagementModal";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { ImagePlus } from "lucide-react";

// Update interface to include tags
interface QuoteFormProps {
  categories: Category[];
  authorProfiles: AuthorProfile[];
  initialData?: CreateQuoteInput & {
    images?: QuoteImageResource[];
    backgroundImage?: string;
    tags?: Tag[];
  };
}

export function QuoteForm({ categories, authorProfiles, initialData }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Add state for tags
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData?.tags || []);
  
  const [charCount, setCharCount] = useState(initialData?.content?.length || 0);
  const [images, setImages] = useState<QuoteImageResource[]>(initialData?.images || []);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.backgroundImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const form = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: initialData || {
      content: "",
      slug: "",
      categoryId: "",
      authorProfileId: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: CreateQuoteInput) {
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          backgroundImage: selectedImage,
          images: images.map(img => ({
            url: img.secure_url,
            publicId: img.public_id,
            isActive: img.secure_url === selectedImage
          })),
          tagIds: selectedTags.map(tag => tag.id)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error.message);
      }

      // Show success message
      toast({
        title: "Success",
        description: "Quote created successfully",
        variant: "default",
      });

      // Reset form
      form.reset();
      setCharCount(0);

      // Redirect to quotes list
      router.push("/manage/quotes");
      router.refresh();

    } catch (error) {
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  // Auto-generate slug based on content
  const handleAutoGenerateSlug = () => {
    const currentContent = form.getValues("content");
    if (currentContent) {
      const generatedSlug = slugify(currentContent.substring(0, 50));
      form.setValue("slug", generatedSlug);
    }
  };

  // Handle image upload with metadata
  const handleImageUpload = async (result: CloudinaryUploadResult) => {
    setIsUploading(true);
    try {
      if (result.event !== "success" || !result.info || typeof result.info === 'string') {
        throw new Error("Upload failed");
      }

      const newImage: QuoteImageResource = {
        public_id: result.info.public_id,
        secure_url: result.info.secure_url,
        format: result.info.format,
        width: result.info.width,
        height: result.info.height,
        resource_type: 'image',
        created_at: new Date().toISOString(),
        bytes: result.info.bytes,
        folder: 'quote-images',
        // Updated context handling
        context: {
          alt: typeof result.info.context?.alt === 'string' ? result.info.context.alt : undefined,
          isGlobal: typeof result.info.context?.isGlobal === 'string' 
            ? result.info.context.isGlobal === 'true'
            : false
        }
      };

      setImages(prev => [...prev, newImage]);

      // Set as selected image if it's the first one
      if (images.length === 0) {
        setSelectedImage(newImage.secure_url);
        form.setValue('backgroundImage', newImage.secure_url);
      }

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process uploaded image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    form.setValue('backgroundImage', imageUrl);
  };

  // Handle image deletion with global check
  const handleImageDelete = async (publicId: string) => {
    try {
      const image = images.find(img => img.public_id === publicId);
      if (!image) return;

      // If image is global, only remove association
      if (image.context?.isGlobal) {
        const response = await fetch(`/api/quotes/${form.getValues("slug")}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: publicId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to remove image');
        }
      } else {
        // Delete non-global image completely
        const response = await fetch(`/api/quotes/${form.getValues("slug")}/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete image');
        }
      }

      setImages(prev => prev.filter(img => img.public_id !== publicId));
      if (selectedImage === image.secure_url) {
        setSelectedImage(null);
        form.setValue('backgroundImage', null);
      }

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  // Add gallery selection handler
  const handleGallerySelect = (selectedImages: GalleryItem[]) => {
    selectedImages.forEach(image => {
      const newImage: QuoteImageResource = {
        public_id: image.publicId,
        secure_url: image.url,
        format: image.format || 'webp',
        width: image.width || 1200,
        height: image.height || 630,
        resource_type: 'image',
        created_at: new Date().toISOString(),
        bytes: image.bytes || 0,
        folder: 'quote-images',
        context: {
          alt: image.altText || undefined, // Convert null to undefined
          quoteId: undefined,
          isGlobal: image.isGlobal || false // Add fallback for isGlobal
        }
      };

      setImages(prev => [...prev, newImage]);

      // Set as selected image if it's the first one
      if (images.length === 0) {
        setSelectedImage(newImage.secure_url);
        form.setValue('backgroundImage', newImage.secure_url);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Content</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Textarea
                    {...field}
                    placeholder="Enter your quote here..."
                    onChange={(e) => {
                      field.onChange(e);
                      setCharCount(e.target.value.length);
                    }}
                    disabled={isSubmitting}
                    className="h-32 resize-none"
                  />
                  <div className={`text-sm text-right ${
                    charCount > 1500 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {charCount}/1500 characters
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Slug Field */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Slug</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Auto-generated or type a slug"
                    className="border border-gray-300 rounded p-2 flex-1"
                  />
                </FormControl>
                <Button type="button" onClick={handleAutoGenerateSlug}>
                  Auto-generate slug
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enhanced Author Profile Field */}
        <FormField
          control={form.control}
          name="authorProfileId"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="space-y-1">
                <FormLabel>Quote Author</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select the original author of this quote
                </p>
              </div>
              
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an author" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authorProfiles.map((author) => (
                    <SelectItem 
                      key={author.id} 
                      value={author.id}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium">{author.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {author.born && `${author.born}`}
                          {author.died && ` - ${author.died}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Author Preview */}
              {field.value && (
                <div className="rounded-lg border bg-card p-4">
                  {authorProfiles.map((author) => 
                    author.id === field.value ? (
                      <div key={author.id} className="space-y-2">
                        <h4 className="font-semibold">{author.name}</h4>
                        {(author.born || author.died) && (
                          <p className="text-sm text-muted-foreground">
                            {author.born && `Born: ${author.born}`}
                            {author.died && ` • Died: ${author.died}`}
                          </p>
                        )}
                        {author.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {author.bio}
                          </p>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add TagInput after the category field */}
        <FormItem>
          <FormLabel>Tags</FormLabel>
          <div className="space-y-2">
            <div className="flex gap-2">
              <FormControl className="flex-1">
                <TagInput
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  disabled={isSubmitting}
                  maxTags={10}
                />
              </FormControl>
              <Button 
                type="button"
                variant="outline"
                onClick={() => setIsTagManagementOpen(true)}
                disabled={isSubmitting}
              >
                Manage Tags
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add up to 10 tags to categorize your quote
            </p>
          </div>
        </FormItem>

        {/* Add Image Gallery */}
        <div className="space-y-4">
          <FormLabel>Quote Background</FormLabel>
          <div className="flex items-center justify-between gap-4">
            <ImageGallery
              images={images}
              selectedImage={selectedImage}
              onSelect={handleImageSelect}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              disabled={isSubmitting || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGalleryOpen(true)}
              disabled={isSubmitting}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Browse Gallery
            </Button>
          </div>
        </div>

        {/* Add GalleryModal */}
        <GalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelect={handleGallerySelect}
          maxSelectable={30 - images.length}
          currentlySelected={images.map(img => img.public_id)}
          title="Quote Background Gallery"
          description="Select images from the gallery to use as quote backgrounds"
        />

        {selectedImage && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Background</h4>
            <div className="relative aspect-[1.91/1] w-full max-w-xl mx-auto overflow-hidden rounded-lg border">
              <CldImage
                src={selectedImage}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                alt="Selected background"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Creating..." : "Create Quote"}
          </Button>
        </div>
      </form>
      <TagManagementModal
        open={isTagManagementOpen}
        onOpenChange={setIsTagManagementOpen}
        onSuccess={() => {
          // Refresh tag suggestions in TagInput
        }}
      />
    </Form>
  );
}