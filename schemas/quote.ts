// schemas/quote.ts
import { z } from "zod";

export const createQuoteSchema = z.object({
  content: z.string().min(1, "Quote content is required"),
  categoryId: z.string().min(1, "Category is required")
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;