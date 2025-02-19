import { z } from "zod";

// Schema for creating a new gallery item
export const createGallerySchema = z.object({
  url: z.string().url("Invalid URL"),
  publicId: z.string().min(1, "Public ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  altText: z.string().optional(),
  format: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().optional(),
  isGlobal: z.boolean().optional().default(true),
});

// Schema for updating a gallery item
export const updateGallerySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  altText: z.string().optional(),
  isGlobal: z.boolean().optional(),
}).refine(data => 
  Object.keys(data).length > 0, 
  "At least one field must be provided for update"
);

// Schema for filtering gallery items
export const galleryFilterSchema = z.object({
  search: z.string().optional(),
  isGlobal: z.boolean().optional(),
  minUsageCount: z.number().int().min(0).optional(),
  maxUsageCount: z.number().int().min(0).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  formats: z.array(z.string()).optional(),
});

// Schema for sorting gallery items
export const gallerySortSchema = z.object({
  field: z.enum(["createdAt", "updatedAt", "title", "usageCount"]),
  direction: z.enum(["asc", "desc"])
});

// Schema for list options
export const galleryListOptionsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  sort: gallerySortSchema.optional(),
  filter: galleryFilterSchema.optional(),
});

// Export types
export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
export type GalleryFilterInput = z.infer<typeof galleryFilterSchema>;
export type GallerySortInput = z.infer<typeof gallerySortSchema>;
export type GalleryListOptionsInput = z.infer<typeof galleryListOptionsSchema>;