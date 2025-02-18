// schemas/tag.ts

import { z } from "zod";

// Base tag schema
export const tagSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(1, "Tag name is required")
    .max(50, "Tag name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Tag name can only contain letters, numbers, spaces, and hyphens"),
  slug: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema for creating a new tag
export const createTagSchema = z.object({
  name: z.string()
    .min(1, "Tag name is required")
    .max(50, "Tag name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Tag name can only contain letters, numbers, spaces, and hyphens")
    .transform(val => val.trim())
});

// Schema for updating a tag
export const updateTagSchema = createTagSchema.partial();

// Schema for tag operations (adding/removing tags from quotes)
export const tagOperationSchema = z.object({
  tagIds: z.array(z.string()).min(1, "At least one tag must be provided")
});

// TypeScript types
export type Tag = z.infer<typeof tagSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagOperationInput = z.infer<typeof tagOperationSchema>;