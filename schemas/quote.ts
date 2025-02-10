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

// Schema for Creating a Quote, now including the optional slug field
export const createQuoteSchema = z.object({
  content: z.string()
    .min(1, "Quote content is required")
    .max(1500, "Quote must not exceed 1500 characters"),
  slug: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  authorProfileId: z.string().min(1, "Author profile is required"), // Add this field
});

// Schema for Updating a Quote
export const updateQuoteSchema = createQuoteSchema.partial();

// TypeScript Types
export type Quote = z.infer<typeof quoteSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;