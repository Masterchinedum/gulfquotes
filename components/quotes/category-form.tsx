// app/components/quotes/category-form.tsx
"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; // Add this import
import { slugify } from "@/lib/utils";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast"; // Add this import

// Update the Zod schema to match our category schema
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and dashes",
    })
    .optional(),
  autoGenerateSlug: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  onSuccess?: () => void;
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const { toast } = useToast();
  const methods = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      autoGenerateSlug: true,
    },
  });
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = methods;

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  // Watch for name changes and auto-generate slug if enabled
  const autoGenerateSlug = watch("autoGenerateSlug");
  const name = watch("name");

  React.useEffect(() => {
    if (autoGenerateSlug && name) {
      setValue("slug", slugify(name));
    }
  }, [name, autoGenerateSlug, setValue]);

  const handleAutoGenerateSlug = () => {
    const currentName = getValues("name");
    if (currentName) {
      setValue("slug", slugify(currentName));
    }
  };

  const onSubmit = async (data: CategoryInput) => {
    setServerError(null);
    setServerSuccess(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category created successfully!"
        });
        reset();
        onSuccess?.(); // Call the success callback if provided
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.error?.message || "Failed to create category"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="p-4 bg-white rounded shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel>Category Name</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Enter category name"
                {...register("name")}
              />
            </FormControl>
            {errors.name && (
              <FormMessage>{errors.name.message}</FormMessage>
            )}
          </FormItem>

          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Auto-generate Slug</FormLabel>
              <Switch
                checked={autoGenerateSlug}
                onCheckedChange={(checked) => setValue("autoGenerateSlug", checked)}
              />
            </div>
            <FormDescription>
              Automatically generate a URL-friendly slug from the category name
            </FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel>Slug</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  type="text"
                  placeholder="url-friendly-slug"
                  {...register("slug")}
                  disabled={autoGenerateSlug}
                />
              </FormControl>
              {!autoGenerateSlug && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleAutoGenerateSlug}
                >
                  Generate
                </Button>
              )}
            </div>
            {errors.slug && (
              <FormMessage>{errors.slug.message}</FormMessage>
            )}
            <FormDescription>
              URL-friendly version of the category name
            </FormDescription>
          </FormItem>

          {serverError && <p className="text-red-500">{serverError}</p>}
          {serverSuccess && <p className="text-green-500">{serverSuccess}</p>}
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create Category"}
          </Button>
        </form>
      </div>
    </FormProvider>
  );
}