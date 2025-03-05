import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/api-error";
import { UpdateQuoteInput } from "@/schemas/quote";

export function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?'"()-]/g, '');
}

export function prepareUpdateData(
  data: UpdateQuoteInput
): Prisma.QuoteUpdateInput {
  return {
    content: data.content,
    slug: data.slug,
    featured: data.featured,
    category: data.categoryId ? {
      connect: { id: data.categoryId }
    } : undefined,
    authorProfile: data.authorProfileId ? {
      connect: { id: data.authorProfileId }
    } : undefined,
    backgroundImage: data.backgroundImage,
    tags: data.tags ? {
      connect: data.tags.connect,
      disconnect: data.tags.disconnect
    } : undefined
  };
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
