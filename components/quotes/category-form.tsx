// app/components/quotes/category-form.tsx
"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define the Zod schema for category creation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export function CategoryForm() {
  // Initialize form methods using react-hook-form
  const methods = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  // States for server feedback
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  // Handle form submission for creating a category
  const onSubmit = async (data: CategoryInput) => {
    console.log("Submitted category data:", data);
    setServerError(null);
    setServerSuccess(null);

    try {
      // Make an API call to add the category to the DB
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setServerSuccess("Category created successfully!");
        reset();
      } else {
        const errorData = await response.json();
        setServerError("Failed to create category: " + (errorData?.error || 'Unknown error'));
      }
    } catch (error: unknown) {
      console.error(error);
      setServerError("Failed to create category. Please try again.");
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
                className="border border-gray-300 rounded p-2 w-full"
              />
            </FormControl>
            {errors.name && (
              <FormMessage className="text-red-500">
                {errors.name.message}
              </FormMessage>
            )}
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