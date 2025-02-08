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
  onSubmit: (data: CreateAuthorProfileInput) => void;
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
    }
  });

  const handleSubmit = (data: CreateAuthorProfileInput) => {
    onSubmit({ ...data, images });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}