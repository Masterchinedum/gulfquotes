// components/quotes/category-edit-form.tsx
"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/utils";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { categoryUpdateSchema, type CategoryUpdateInput } from "@/schemas/category";
import { Category } from "@prisma/client";

interface CategoryEditFormProps {
  category: Category;
  onSuccess?: () => void;
}

export function CategoryEditForm({ category, onSuccess }: CategoryEditFormProps) {
  const methods = useForm<CategoryUpdateInput>({
    resolver: zodResolver(categoryUpdateSchema),
    defaultValues: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      autoGenerateSlug: false,
    },
  });

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (data: CategoryUpdateInput) => {
    setServerError(null);
    setServerSuccess(null);

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setServerSuccess("Category updated successfully!");
        onSuccess?.();
      } else {
        const errorData = await response.json();
        setServerError("Failed to update category: " + (errorData?.error?.message || 'Unknown error'));
      }
    } catch (error: unknown) {
      console.error(error);
      setServerError("Failed to update category. Please try again.");
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
          
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}