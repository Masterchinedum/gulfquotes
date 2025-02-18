// components/quotes/edit-quote-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateQuoteSchema } from "@/schemas/quote";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Quote, Category, AuthorProfile } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils";
import type { UpdateQuoteInput } from "@/schemas/quote";
import { ImageGallery } from "@/components/quotes/image-gallery";
import type { CloudinaryUploadResult, QuoteImageResource } from "@/types/cloudinary";
import { CldImage } from "next-cloudinary";
import type { MediaLibraryItem } from "@/types/cloudinary";
import { MediaLibraryModal } from "@/components/media/media-library-modal";

interface EditQuoteFormProps {
  quote: Quote & {
    category: Category;
    authorProfile: AuthorProfile;
    images?: QuoteImageResource[];
    backgroundImage: string | null;  // Change this to accept null
  };
  categories: Category[];
  authorProfiles: AuthorProfile[];
}

export function EditQuoteForm({ quote, categories, authorProfiles }: EditQuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [charCount, setCharCount] = useState(quote.content.length);
  
  const [images, setImages] = useState<QuoteImageResource[]>(quote.images || []);
  const [selectedImage, setSelectedImage] = useState<string | null>(quote.backgroundImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  
  const form = useForm<UpdateQuoteInput>({
    resolver: zodResolver(updateQuoteSchema),
    defaultValues: {
      content: quote.content,
      slug: quote.slug,
      categoryId: quote.categoryId,
      authorProfileId: quote.authorProfileId,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: UpdateQuoteInput) {
    try {
      const response = await fetch(`/api/quotes/${quote.slug}`, {
        method: "PATCH",
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
          }))
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error.message);
      }

      // Show success message
      toast({
        title: "Success",
        description: "Quote updated successfully",
        variant: "default",
      });

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

  // Handle image upload
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
        context: {
          alt: typeof result.info.context?.alt === 'string' ? result.info.context.alt : undefined,
          isGlobal: typeof result.info.context?.isGlobal === 'string' 
            ? result.info.context.isGlobal === 'true'
            : false
        }
      };

      setImages(prev => [...prev, newImage]);

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

  // Handle image deletion
  const handleImageDelete = async (publicId: string) => {
    try {
      const image = images.find(img => img.public_id === publicId);
      if (!image) return;

      if (image.context?.isGlobal) {
        const response = await fetch(`/api/quotes/${quote.slug}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: publicId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to remove image');
        }
      } else {
        const response = await fetch(`/api/quotes/${quote.slug}/images`, {
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

  // Handle media library selection
  const handleMediaLibrarySelect = (selectedImages: MediaLibraryItem[]) => {
    selectedImages.forEach(image => {
      const newImage: QuoteImageResource = {
        public_id: image.public_id,
        secure_url: image.secure_url,
        format: image.format,
        width: image.width,
        height: image.height,
        resource_type: 'image',
        created_at: image.created_at,
        bytes: image.bytes,
        folder: image.folder,
        context: {
          alt: image.altText,
          quoteId: undefined,
          isGlobal: true
        }
      };

      setImages(prev => [...prev, newImage]);

      if (images.length === 0) {
        setSelectedImage(newImage.secure_url);
        form.setValue('backgroundImage', newImage.secure_url);
      }
    });

    setIsMediaLibraryOpen(false);
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
                    placeholder="URL-friendly slug"
                    className="flex-1"
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAutoGenerateSlug}
                  disabled={isSubmitting}
                >
                  Generate
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="authorProfileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an author" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authorProfiles.map((author) => (
                    <SelectItem 
                      key={author.id} 
                      value={author.id}
                    >
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        <div className="space-y-4">
          <FormLabel>Quote Background</FormLabel>
          <ImageGallery
            images={images}
            selectedImage={selectedImage}
            onSelect={handleImageSelect}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            disabled={isSubmitting || isUploading}
            onMediaLibraryOpen={() => setIsMediaLibraryOpen(true)}
          />
          
          <MediaLibraryModal
            isOpen={isMediaLibraryOpen}
            onClose={() => setIsMediaLibraryOpen(false)}
            onSelect={handleMediaLibrarySelect}
            maxSelectable={30 - images.length}
            currentlySelected={images.map(img => img.public_id)}
            title="Quote Background Library"
            description="Select images from your library or upload new ones to use as quote backgrounds"
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
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/manage/quotes")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}