import { z } from "zod";

// Base Schema for AuthorProfile validation
const authorProfileBaseSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  born: z.string()
    .nullable()
    .optional(),
  died: z.string()
    .nullable()
    .optional(),
  influences: z.string()
    .nullable()
    .optional(),
  bio: z.string()
    .min(1, "Biography is required")
    .max(2000, "Biography must be less than 2000 characters"),
  slug: z.string()
    .optional(), // Make slug optional as it can be auto-generated
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
export type CreateAuthorProfileInput = z.infer<typeof createAuthorProfileSchema>;
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