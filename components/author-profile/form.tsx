"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { createAuthorProfileSchema, type CreateAuthorProfileInput } from "@/lib/auth/author-profile";

interface AuthorProfileFormProps {
  initialData?: CreateAuthorProfileInput;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function AuthorProfileForm({
  initialData,
  onSubmit,
  isLoading
}: AuthorProfileFormProps) {
  const [images, setImages] = useState(initialData?.images || {});

  const form = useForm<CreateAuthorProfileInput>({
    resolver: zodResolver(createAuthorProfileSchema),
    defaultValues: initialData || {
      name: "",
      born: "",
      died: "",
      influences: "",
      bio: "",
      slug: "",
      images: { profile: "", gallery: [] }
    },
    mode: "onSubmit" // Add this to ensure validation on submit
  });

  const handleSubmit = async (data: CreateAuthorProfileInput) => {
    try {
      console.log('Form handleSubmit called with data:', data);
      
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images') {
          formData.append(key, String(value));
        }
      });

      // Add images only if they exist
      if (images.profile) {
        formData.append('profile', images.profile);
      }
      if (images.gallery?.length) {
        images.gallery.forEach(url => {
          formData.append('gallery', url);
        });
      }

      console.log('Submitting FormData:', Array.from(formData.entries()));
      await onSubmit(formData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      throw error;
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          console.log("Form submission event triggered");
          
          form.handleSubmit(async (data) => {
            console.log("Form validation passed with data:", data);
            try {
              await handleSubmit(data);
            } catch (error) {
              console.error("Form submission failed:", error);
            }
          })(e);
        }} 
        className="space-y-6"
        encType="multipart/form-data"
      >
        <Button 
          type="button" 
          onClick={() => console.log('Test button clicked')}
          className="mb-4"
        >
          Test Console Log
        </Button>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="born"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Born</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="died"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Died</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="influences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Influences</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  disabled={isLoading}
                  className="min-h-[150px]" 
                />
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
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Images</FormLabel>
          <ImageUpload
            value={images.profile ? [images.profile] : []}
            onChange={(urls) => setImages({ ...images, profile: urls[0] })}
            onRemove={() => setImages({ ...images, profile: "" })}
          />
          <ImageUpload
            value={images.gallery || []}
            onChange={(urls) => setImages({ ...images, gallery: urls })}
            onRemove={(url) => setImages({
              ...images,
              gallery: (images.gallery || []).filter(i => i !== url)
            })}
            multiple
          />
        </div>

        <Button 
          type="submit" 
          disabled={isLoading || form.formState.isSubmitting}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}