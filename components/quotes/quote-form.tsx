"use client";

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
import { Category, AuthorProfile, Tag } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";
import { CldImage } from "next-cloudinary";
import { TagInput } from "@/components/forms/TagInput";
import { TagManagementModal } from "@/components/forms/TagManagementModal";
import { QuoteGalleryModal } from "@/components/quotes/quote-gallery-modal";
import { ImagePlus } from "lucide-react";

interface QuoteFormProps {
  categories: Category[];
  authorProfiles: AuthorProfile[];
  initialData?: CreateQuoteInput & {
    backgroundImage?: string;
    galleryImages?: GalleryItem[];
    tags?: Tag[];
  };
}

export function QuoteForm({ categories, authorProfiles, initialData }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData?.tags || []);
  const [charCount, setCharCount] = useState(initialData?.content?.length || 0);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>(initialData?.galleryImages || []);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.backgroundImage || null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);

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
          galleryImages: galleryImages.map(img => ({
            id: img.id,
            isActive: img.url === selectedImage
          })),
          tagIds: selectedTags.map(tag => tag.id)
        }),
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
    const newImages = selectedImages.filter(
      newImg => !galleryImages.some(img => img.id === newImg.id)
    );
    
    setGalleryImages(prev => [...prev, ...newImages]);

    // Set first image as background if none selected
    if (!selectedImage && newImages.length > 0) {
      setSelectedImage(newImages[0].url);
      form.setValue('backgroundImage', newImages[0].url);
    }
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
        <div className="space-y-4">
          <FormLabel>Quote Background</FormLabel>
          <div className="flex items-center justify-between gap-4">
            <div className="grid grid-cols-4 gap-4 flex-1">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative aspect-[1.91/1] overflow-hidden rounded-lg border cursor-pointer
                    ${selectedImage === image.url ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelectedImage(image.url);
                    form.setValue('backgroundImage', image.url);
                  }}
                >
                  <CldImage
                    src={image.publicId}
                    fill
                    sizes="(max-width: 768px) 25vw, 20vw"
                    alt={image.altText || "Gallery image"}
                    className="object-cover"
                  />
                </div>
              ))}
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