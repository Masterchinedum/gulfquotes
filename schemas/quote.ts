import { z } from "zod";

// Base Quote Schema
export const quoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Quote content is required"),
  slug: z.string(),
  authorId: z.string(),
  categoryId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema for Creating a Quote
export const createQuoteSchema = z.object({
  content: z.string()
    .min(1, "Quote content is required")
    .max(500, "Quote must not exceed 500 characters"),
  categoryId: z.string().min(1, "Category is required"),
});

// Schema for Updating a Quote
export const updateQuoteSchema = createQuoteSchema.partial();

// TypeScript Types
export type Quote = z.infer<typeof quoteSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;