import { z } from "zod";

export const authorImageSchema = z.object({
  id: z.string(),
  url: z.string().url("Invalid image URL"),
});

export const authorProfileBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().min(1, "Biography is required").max(2000),
  born: z.string().nullable().optional(),
  died: z.string().nullable().optional(),
  influences: z.string().nullable().optional(),
  slug: z.string().optional(),
  images: z.array(authorImageSchema).default([]),
});

// Schema for creating a new author profile
export const createAuthorProfileSchema = authorProfileBaseSchema;

// Schema for updating an existing author profile
export const updateAuthorProfileSchema = authorProfileBaseSchema
  .partial() // Makes all fields optional for updates
  .refine((data) => {
    // Ensure at least one field is present in update
    return Object.keys(data).length > 0;
  }, {
    message: "At least one field must be provided for update",
  });

// TypeScript Types
export type CreateAuthorProfileInput = z.infer<typeof authorProfileBaseSchema>;
export type UpdateAuthorProfileInput = z.infer<typeof updateAuthorProfileSchema>;

// Custom validator for influences
export const validateInfluences = (influences: string): string[] => {
  if (!influences) return [];
  // Split by comma and trim whitespace
  return influences
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
};