import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/api-error";
import { UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import type { Quote } from "@prisma/client";

export function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?'"()-]/g, '');
}

export function prepareUpdateData(
  data: UpdateQuoteInput,
  existingQuote: Quote
): Prisma.QuoteUpdateInput {
  const updateData: Prisma.QuoteUpdateInput = { ...data };

  if (data.content || data.slug !== undefined) {
    const sanitizedContent = data.content
      ? sanitizeContent(data.content)
      : existingQuote.content;

    const newSlug = data.slug?.trim() || slugify(sanitizedContent.substring(0, 50));

    if (data.content) {
      updateData.content = sanitizedContent;
    }
    updateData.slug = newSlug;
  }

  return updateData;
}

export function handleUpdateError(error: unknown): never {
  if (error instanceof AppError) throw error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        throw new AppError("Quote was modified by another user", "CONCURRENT_MODIFICATION", 409);
      case 'P2002':
        throw new AppError("Quote with this slug already exists", "DUPLICATE_SLUG", 400);
      default:
        throw new AppError("Database error occurred", "DATABASE_ERROR", 500);
    }
  }
  throw new AppError("Failed to update quote", "INTERNAL_ERROR", 500);
}
