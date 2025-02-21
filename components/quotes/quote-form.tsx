"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuoteFormSchema, createQuoteAPISchema, CreateQuoteInput } from "@/schemas/quote";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Category, AuthorProfile, Tag } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";
import type { CloudinaryUploadResult } from "@/types/cloudinary"; // Add this import
import { TagInput } from "@/components/forms/TagInput";
import { TagManagementModal } from "@/components/forms/TagManagementModal";
import { QuoteGalleryModal } from "@/components/quotes/quote-gallery-modal";
import { ImagePlus } from "lucide-react";
import { QuoteImageUpload } from "@/components/quotes/quote-image-upload";
import { QuoteImageGallery } from "@/components/quotes/quote-image-gallery";

// Add new interface for image state
interface SelectedImageState {
  imageUrl: string | null;
  publicId: string | null;
  isBackground: boolean;
}

// QuoteFormProps interface update
interface QuoteFormProps {
  categories: Category[];
  authorProfiles: AuthorProfile[];
  initialData?: CreateQuoteInput & {
    backgroundImage?: string;
    galleryImages?: GalleryItem[]; // This needs to be a full GalleryItem
    tags?: Tag[];
  };
}

export function QuoteForm({ categories, authorProfiles, initialData }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData?.tags || []);
  const [charCount, setCharCount] = useState(initialData?.content?.length || 0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Update the image state initialization
  const [selectedImage, setSelectedImage] = useState<SelectedImageState>(() => {
    const matchingImage = initialData?.galleryImages?.find(
      img => 'url' in img && 
      'publicId' in img && 
      img.url === initialData.backgroundImage
    ) as GalleryItem | undefined; // Add type assertion

    return {
      imageUrl: initialData?.backgroundImage || null,
      publicId: matchingImage?.publicId || null,
      isBackground: !!initialData?.backgroundImage
    };
  });

  // Update gallery images state initialization - don't set isActive/isBackground by default
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>(() => {
    if (!initialData?.galleryImages) return [];

    return initialData.galleryImages.map(img => {
      const fullImage = img as unknown as GalleryItem & {
        format?: string;
        width?: number;
        height?: number;
        bytes?: number;
        isGlobal?: boolean;
        title?: string;
        description?: string;
        altText?: string;
        createdAt?: Date;
        updatedAt?: Date;
        usageCount?: number;
      };

      const galleryItem: GalleryItem = {
        id: fullImage.id,
        url: fullImage.url,
        publicId: fullImage.publicId,
        format: fullImage.format || '',
        width: fullImage.width || 0,
        height: fullImage.height || 0,
        bytes: fullImage.bytes || 0,
        isGlobal: fullImage.isGlobal || false,
        title: fullImage.title || '',
        description: fullImage.description || '',
        altText: fullImage.altText || '',
        createdAt: fullImage.createdAt || new Date(),
        updatedAt: fullImage.updatedAt || new Date(),
        usageCount: fullImage.usageCount || 0,
        isActive: false, // Set to false by default
        isBackground: false // Set to false by default
      };

      return galleryItem;
    });
  });

  // Update the form type
  const form = useForm<z.infer<typeof createQuoteFormSchema>>({
    resolver: zodResolver(createQuoteFormSchema),
    defaultValues: {
      content: initialData?.content || "",
      slug: initialData?.slug || "",
      categoryId: initialData?.categoryId || "",
      authorProfileId: initialData?.authorProfileId || "",
    },
  });

  const { isSubmitting } = form.formState;

  // The submit handler transforms the data
  async function onSubmit(formData: z.infer<typeof createQuoteFormSchema>) {
    try {
      // Transform to API format
      const apiData = {
        ...formData,
        backgroundImage: selectedImage.imageUrl,
        tags: selectedTags.length > 0 ? {
          connect: selectedTags.map(tag => ({ id: tag.id }))
        } : undefined,
        gallery: galleryImages.length > 0 ? {
          create: galleryImages.map(img => ({
            galleryId: img.id,
            isActive: img.url === selectedImage.imageUrl
          }))
        } : undefined
      };

      // Validate API data
      const validatedData = createQuoteAPISchema.parse(apiData);

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Success",
        description: "Quote created successfully",
        variant: "default",
      });

      form.reset();
      setCharCount(0);
      router.push("/manage/quotes");
      router.refresh();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  // Handle gallery selection
  const handleGallerySelect = (selectedImages: GalleryItem[]) => {
    // Filter out images that are already in the quote's gallery
    const newImages = selectedImages.filter(
      newImg => !galleryImages.some(img => img.id === newImg.id)
    );
    
    // Add new images to gallery with no active/background state
    setGalleryImages(prev => {
      const updated = [...prev];
      newImages.forEach(newImg => {
        updated.push({
          ...newImg,
          isActive: false,
          isBackground: false
        });
      });
      return updated;
    });
  };

  // Add handleAutoGenerateSlug function
  const handleAutoGenerateSlug = () => {
    const content = form.getValues("content");
    if (content) {
      const generatedSlug = slugify(content.substring(0, 50));
      form.setValue("slug", generatedSlug);
    } else {
      toast({
        title: "Error",
        description: "Please enter quote content first",
        variant: "destructive",
      });
    }
  };

  // Update image selection handler
  const handleImageSelect = (image: GalleryItem) => {
    setSelectedImage({
      imageUrl: image.url,
      publicId: image.publicId,
      isBackground: true
    });
    
    form.setValue('backgroundImage', image.url);

    // Update gallery images to reflect background selection
    setGalleryImages(prev => 
      prev.map(img => ({
        ...img,
        isActive: img.id === image.id,
        isBackground: img.url === image.url
      }))
    );
  };

  // Add image deselection handler - completely remove from gallery
  const handleImageDeselect = (imageId: string) => {
    const image = galleryImages.find(img => img.id === imageId);
    if (!image) return;

    // If this was the background image, reset it
    if (image.url === selectedImage.imageUrl) {
      setSelectedImage({
        imageUrl: null,
        publicId: null,
        isBackground: false
      });
      form.setValue('backgroundImage', null);
    }

    // Remove the image from gallery completely
    setGalleryImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Update upload handler
  const handleImageUpload = async (result: CloudinaryUploadResult) => {
    if (result.event === "success" && result.info && typeof result.info !== 'string') {
      setIsUploading(false);
      
      const newImage: GalleryItem = {
        id: result.info.public_id,
        url: result.info.secure_url,
        publicId: result.info.public_id,
        format: result.info.format,
        width: result.info.width,
        height: result.info.height,
        bytes: result.info.bytes,
        isGlobal: true,
        title: '',
        description: '', // Add missing required property
        altText: '',    // Add missing required property
        createdAt: new Date(),
        updatedAt: new Date(), // Add missing required property
        usageCount: 0,
        isActive: !selectedImage.imageUrl,
        isBackground: !selectedImage.imageUrl
      };

      setGalleryImages(prev => [...prev, newImage]);

      // Auto-select as background if none selected
      if (!selectedImage.imageUrl) {
        setSelectedImage({
          imageUrl: newImage.url,
          publicId: newImage.publicId,
          isBackground: true
        });
        form.setValue('backgroundImage', newImage.url);
      }
    }
    setIsUploading(false);
  };

  // Rest of your component remains the same...
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

        {/* Gallery Section */}
        <div className="space-y-6 rounded-lg border bg-card">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <FormLabel className="text-base font-semibold">Quote Images</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Upload or select images for your quote background
                </p>
              </div>
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

          {/* Upload Section */}
          <div className="p-6 border-b bg-muted/50">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Upload</h4>
              <QuoteImageUpload
                onUploadComplete={handleImageUpload}
                disabled={isSubmitting}
                isUploading={isUploading}
                maxFiles={30 - galleryImages.length}
              />
            </div>
          </div>

          {/* Selected Images Section */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Selected Images</h4>
                <p className="text-sm text-muted-foreground">
                  {galleryImages.length} of 30 images
                </p>
              </div>

              {/* Gallery Grid */}
              <QuoteImageGallery
                items={galleryImages}
                selectedImage={selectedImage.imageUrl}
                currentlySelected={galleryImages.map(img => img.publicId)}
                maxSelectable={30}
                onSelect={handleImageSelect}
                onDeselect={handleImageDeselect} // Make sure this is connected
                isBackground={true}
                disabled={isSubmitting || isUploading}
              />

              {/* Selected Background Preview */}
              {selectedImage.imageUrl && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Background Preview</h4>
                  <div className="relative aspect-[1.91/1] rounded-lg overflow-hidden">
                    <Image
                      src={selectedImage.imageUrl}
                      alt="Selected background"
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <QuoteGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelect={handleGallerySelect}
          maxSelectable={30 - galleryImages.length}
          currentlySelected={galleryImages.map(img => img.publicId)}
          title="Quote Background Gallery"
          description="Select images from the gallery to use as quote backgrounds"
        />

        {/* Submit Button */}
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