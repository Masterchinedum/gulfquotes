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

// Define the schema for category creation using Zod
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type CategoryInput = z.infer<typeof categorySchema>;

export function CategoryForm() {
  // Initialize the form with react-hook-form and Zod validation
  const methods = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = methods;

  // States to display success or error messages from the server
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  // Handle form submission
  const onSubmit = async (data: CategoryInput) => {
    console.log("Submitted category data:", data);
    setServerError(null);
    setServerSuccess(null);

    try {
      // Replace this placeholder with your actual API call if needed.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setServerSuccess("Category created successfully!");
      reset();
    } catch (_error: unknown) {
      console.error(_error);
      setServerError("Failed to create category. Please try again.");
    }
  };

  return (
    <FormProvider {...methods}>
      <div>
        {/* CategoryForm Component - /Users/user/Desktop/Creations/quoticon/app/components/quotes/category-form.tsx */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel>Category Name</FormLabel>
            <FormControl>
              <Input type="text" placeholder="Enter category name" {...register("name")} />
            </FormControl>
            {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
          </FormItem>
          {serverError && <p className="text-red-500">{serverError}</p>}
          {serverSuccess && <p className="text-green-500">{serverSuccess}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Category"}
          </Button>
        </form>
      </div>
    </FormProvider>
  );
}