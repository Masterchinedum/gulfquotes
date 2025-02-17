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
import { Category, AuthorProfile } from "@prisma/client"; // Update existing import
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils"; // Import slugify utility
import { ImageGallery } from "@/components/quotes/image-gallery";
import type { CloudinaryUploadResult, QuoteImageResource } from "@/types/cloudinary";
import { CldImage } from "next-cloudinary";

interface QuoteFormProps {
  categories: Category[];
  authorProfiles: AuthorProfile[];  // Add this
  initialData?: CreateQuoteInput & {
    images?: QuoteImageResource[];
    backgroundImage?: string;
  };
}

export function QuoteForm({ categories, authorProfiles, initialData }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [charCount, setCharCount] = useState(initialData?.content?.length || 0);
  const [images, setImages] = useState<QuoteImageResource[]>(initialData?.images || []);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.backgroundImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: initialData || {
      content: "",
      slug: "",
      categoryId: "",
      authorProfileId: "", // Add this default value
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

  // Handle image upload
  const handleImageUpload = async (result: CloudinaryUploadResult) => {
    setIsUploading(true);
    try {
      if (result.event !== "success" || !result.info) {
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
      };

      setImages(prev => [...prev, newImage]);
      
      // Optionally set this as the selected image if it's the first one
      if (images.length === 0) {
        setSelectedImage(newImage.secure_url);
        form.setValue('backgroundImage', newImage.secure_url);
      }

    } catch (uploadError) {
      toast({
        title: "Error",
        description: uploadError instanceof Error 
          ? uploadError.message 
          : "Failed to process uploaded image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    // Update the form data with the selected background image
    form.setValue('backgroundImage', imageUrl);
  };

  // Handle image deletion
  const handleImageDelete = async (publicId: string) => {
    try {
      const response = await fetch('/api/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete image');
      }

      setImages(prev => prev.filter(img => img.public_id !== publicId));
      if (images.find(img => img.secure_url === selectedImage)?.public_id === publicId) {
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

        {/* Add Image Gallery */}
        <div className="space-y-4">
          <FormLabel>Quote Background</FormLabel>
          <ImageGallery
            images={images}
            selectedImage={selectedImage}
            onSelect={handleImageSelect}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            disabled={isSubmitting || isUploading}
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

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Creating..." : "Create Quote"}
          </Button>
        </div>
      </form>
    </Form>
  );
}