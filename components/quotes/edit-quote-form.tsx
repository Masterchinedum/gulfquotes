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
import { Quote, Category, AuthorProfile, Tag } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils";
import type { UpdateQuoteInput } from "@/schemas/quote";
import { ImageGallery } from "@/components/quotes/image-gallery";
import type { CloudinaryUploadResult, QuoteImageResource } from "@/types/cloudinary";
import type { GalleryItem } from "@/types/gallery";
import { CldImage } from "next-cloudinary";
import { TagInput } from "@/components/forms/TagInput";
import { TagManagementModal } from "@/components/forms/TagManagementModal";
import { ImagePlus } from "lucide-react";
import { QuoteGalleryModal } from "@/components/quotes/quote-gallery-modal";
import { QuoteImageUpload } from "@/components/quotes/quote-image-upload";

// EditQuoteForm state updates
interface SelectedImageState {
  imageUrl: string | null;
  publicId: string | null;
  isBackground: boolean;
}

interface EditQuoteFormProps {
  quote: Quote & {
    category: Category;
    authorProfile: AuthorProfile;
    gallery: {
      gallery: GalleryItem;
      isActive: boolean;
    }[];
    images?: QuoteImageResource[]; // Add this field
    backgroundImage: string | null;
    tags: Tag[];
  };
  categories: Category[];
  authorProfiles: AuthorProfile[];
}

export function EditQuoteForm({ quote, categories, authorProfiles }: EditQuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [charCount, setCharCount] = useState(quote.content.length);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(quote.tags || []);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Updated image states
  const [selectedImage, setSelectedImage] = useState<SelectedImageState>({
    imageUrl: quote.backgroundImage,
    publicId: quote.gallery.find(g => g.isActive)?.gallery.publicId || null,
    isBackground: !!quote.backgroundImage
  });

  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>(
    quote.gallery.map(g => ({
      ...g.gallery,
      isActive: g.isActive,
      isBackground: g.gallery.url === quote.backgroundImage
    }))
  );

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
          backgroundImage: selectedImage.imageUrl,
          galleryImages: galleryImages.map(img => ({
            id: img.id,
            isActive: img.url === selectedImage.imageUrl,
            isBackground: img.url === selectedImage.imageUrl
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
    if (result.event === "success" && result.info && typeof result.info !== 'string') {
      setIsUploading(false); // Reset upload state on success
      
      const baseGalleryItem: Omit<GalleryItem, 'isActive' | 'isBackground'> = {
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
        usageCount: 0
      };

      const newImage: GalleryItem = {
        ...baseGalleryItem,
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

  // Handle image selection
  const handleImageSelect = (image: GalleryItem) => {
    setSelectedImage({
      imageUrl: image.url,
      publicId: image.publicId,
      isBackground: true
    });
    
    // Update form value
    form.setValue('backgroundImage', image.url);

    // Update gallery images to reflect selection
    setGalleryImages(prev => 
      prev.map(img => ({
        ...img,
        isActive: img.id === image.id,
        isBackground: img.url === image.url
      }))
    );
  };

  // Handle image deletion
  const handleImageDelete = async (imageId: string) => {
    try {
      const image = galleryImages.find(img => img.id === imageId);
      if (!image) return;

      const response = await fetch(`/api/quotes/${quote.slug}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageId,
          isGlobal: image.isGlobal 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete image');
      }

      // Update state after successful deletion
      setGalleryImages(prev => prev.filter(img => img.id !== imageId));

      // Clear selected image if it was deleted
      if (image.url === selectedImage.imageUrl) {
        setSelectedImage({
          imageUrl: null,
          publicId: null,
          isBackground: false
        });
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

  // Handle gallery selection
  const handleGallerySelect = (selectedImages: GalleryItem[]) => {
    const newImages = selectedImages.filter(
      newImg => !galleryImages.some(img => img.id === newImg.id)
    );
    
    // Update gallery images with selection status
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

    // Auto-select first image as background if none selected
    if (!selectedImage.imageUrl && newImages.length > 0) {
      const firstImage = newImages[0];
      setSelectedImage({
        imageUrl: firstImage.url,
        publicId: firstImage.publicId,
        isBackground: true
      });
      form.setValue('backgroundImage', firstImage.url);
      
      // Update gallery images to reflect selection
      setGalleryImages(prev => 
        prev.map(img => ({
          ...img,
          isActive: img.id === firstImage.id,
          isBackground: img.url === firstImage.url
        }))
      );
    }
  };

  // Add deselection handler
  const handleImageDeselect = (imageId: string) => {
    const image = galleryImages.find(img => img.id === imageId);
    if (!image) return;

    if (image.url === selectedImage.imageUrl) {
      setSelectedImage({
        imageUrl: null,
        publicId: null,
        isBackground: false
      });
      form.setValue('backgroundImage', null);
    }

    setGalleryImages(prev =>
      prev.map(img => ({
        ...img,
        isActive: img.id === imageId ? false : img.isActive,
        isBackground: img.id === imageId ? false : img.isBackground
      }))
    );
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

        <TagManagementModal
          open={isTagManagementOpen}
          onOpenChange={setIsTagManagementOpen}
          onSuccess={() => {
            // Refresh tag suggestions in TagInput
          }}
        />

        <div className="space-y-4">
          <FormLabel>Quote Background</FormLabel>
          <QuoteImageUpload
            onUploadComplete={handleImageUpload}
            disabled={isSubmitting}
            isUploading={isUploading}
            maxFiles={30 - galleryImages.length}
          />
          <div className="flex items-center justify-between gap-4">
            <ImageGallery
              images={galleryImages}
              selectedImage={selectedImage.imageUrl}
              onSelect={handleImageSelect}
              onDeselect={handleImageDeselect}
              onDelete={handleImageDelete} // Add this line
              onUpload={handleImageUpload}
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

        <QuoteGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelect={handleGallerySelect}
          onDeselect={handleImageDeselect}
          maxSelectable={30 - galleryImages.length}
          currentlySelected={galleryImages.map(img => img.publicId)}
          selectedImage={selectedImage.imageUrl}
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