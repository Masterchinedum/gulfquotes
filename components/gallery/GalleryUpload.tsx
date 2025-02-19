"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { cloudinaryConfig } from "@/lib/cloudinary";
import { ImagePlus, Loader2 } from "lucide-react";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGallerySchema, type CreateGalleryInput } from "@/schemas/gallery";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface GalleryUploadProps {
  onUploadComplete: (data: CreateGalleryInput) => void;
  disabled?: boolean;
}

export function GalleryUpload({ onUploadComplete, disabled = false }: GalleryUploadProps) {
  const [uploading, setUploading] = useState(false);

  const form = useForm<CreateGalleryInput>({
    resolver: zodResolver(createGallerySchema),
    defaultValues: {
      title: "",
      description: "",
      altText: "",
      isGlobal: true,
    }
  });

  const handleUploadSuccess = (result: CloudinaryUploadResult) => {
    setUploading(false);
    if (result.event !== "success" || !result.info) return;

    const info = result.info;
    form.setValue("url", info.secure_url);
    form.setValue("publicId", info.public_id);
    form.setValue("format", info.format);
    form.setValue("width", info.width);
    form.setValue("height", info.height);
    form.setValue("bytes", info.bytes);
  };

  const onSubmit = (data: CreateGalleryInput) => {
    onUploadComplete(data);
    form.reset();
  };

  return (
    <div className="space-y-4">
      {/* Upload Widget */}
      <div className="flex justify-center p-6 border-2 border-dashed rounded-lg">
        <CloudinaryUploadWidget
          onUploadSuccess={handleUploadSuccess}
          onOpen={() => setUploading(true)}
          options={{
            ...cloudinaryConfig.limits.gallery,
            folder: 'gallery',
            tags: ['gallery'],
            sources: ['local', 'url', 'camera'],
            showAdvancedOptions: false,
            maxFiles: 1
          }}
          disabled={disabled || uploading}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              onClick={() => open()}
              disabled={disabled || uploading}
              className="w-full max-w-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          )}
        </CloudinaryUploadWidget>
      </div>

      {/* Metadata Form */}
      {form.watch("url") && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Image title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Image description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="altText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Text</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Alternative text for accessibility" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="isGlobal"
                      checked={field.value}
                      onChange={field.onChange}
                      aria-describedby="isGlobal-description"
                      title="Make image available in global library"
                      aria-label="Make image available in global library"
                    />
                  </FormControl>
                  <FormLabel htmlFor="isGlobal" className="!mt-0">
                    Available in global library
                  </FormLabel>
                  <span id="isGlobal-description" className="sr-only">
                    When enabled, this image will be available in the global library for all users
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={disabled || uploading}>
                Save Image
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}