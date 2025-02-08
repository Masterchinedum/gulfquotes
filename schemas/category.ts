// schemas/category.ts
import { z } from "zod";

/**
 * Zod schema for validating a category.
 */
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

// Type inferred from the schema
export type CategoryInput = z.infer<typeof categorySchema>;