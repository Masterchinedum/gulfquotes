import { z } from "zod";

// Base Quote Schema
export const quoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Quote content is required"),
  slug: z.string(),  // The slug generated or provided
  authorId: z.string(),
  categoryId: z.string(),
  authorProfileId: z.string(), // Add this field
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Add new schema for quote images
const quoteImageSchema = z.object({
  id: z.string().min(1, "ID is required"),
  url: z.string().url("Invalid URL"),
  publicId: z.string().min(1, "Public ID is required"),
  isActive: z.boolean().default(false)
});

// Schema for Creating a Quote, now including the optional slug field
export const createQuoteSchema = z.object({
  content: z.string()
    .min(1, "Quote content is required")
    .max(1500, "Quote must not exceed 1500 characters"),
  slug: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  authorProfileId: z.string().min(1, "Author profile is required"), // Add this field
  backgroundImage: z.string().url().nullable().optional(),
  images: z.array(quoteImageSchema).max(30, "Maximum 30 images allowed").optional()
});

// Update the updateQuoteSchema with specific edit validations
export const updateQuoteSchema = z.object({
  content: z.string()
    .min(1, "Quote content is required")
    .max(1500, "Quote must not exceed 1500 characters")
    .optional(),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
    .optional(),
  categoryId: z.string()
    .min(1, "Category is required")
    .optional(),
  authorProfileId: z.string()
    .min(1, "Author profile is required")
    .optional(),
  backgroundImage: z.string().url().nullable().optional(),
  addImages: z.array(quoteImageSchema).max(30).optional(),
  removeImages: z.array(z.string()).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided for update"
);

// Add a schema for edit response validation
export const editQuoteResponseSchema = quoteSchema.extend({
  updatedAt: z.date(),
  previousVersion: quoteSchema.optional(),
});

// TypeScript Types
export type Quote = z.infer<typeof quoteSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type EditQuoteResponse = z.infer<typeof editQuoteResponseSchema>;