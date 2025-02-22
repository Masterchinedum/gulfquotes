// schemas/category.ts
import { z } from "zod";

/**
 * Zod schema for validating a category.
 */
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and dashes",
    })
    .optional(), // Making it optional since it can be auto-generated
  autoGenerateSlug: z.boolean().default(true), // Control whether to auto-generate slug
});

/**
 * Schema for updating categories
 */
export const categoryUpdateSchema = categorySchema.extend({
  id: z.string().min(1, "Category ID is required"),
});

// Types inferred from the schemas
export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;