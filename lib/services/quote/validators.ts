import { AppError } from "@/lib/api-error";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { validateQuoteOwnership, QuoteAccessError } from "@/lib/auth/ownership";
import { validateQuoteImages } from "@/lib/utils/image-management";
import { cloudinaryConfig } from "@/lib/cloudinary";
import type { QuoteImageData } from "./types";
import type { Quote } from "@prisma/client";
import type { UpdateQuoteInput } from "@/schemas/quote";

export async function validateCategory(categoryId: string): Promise<void> {
  const category = await db.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError("Category not found", "CATEGORY_NOT_FOUND", 404);
  }
}

export async function validateSlug(slug: string, excludeId?: string): Promise<void> {
  const existingQuote = await db.quote.findFirst({
    where: {
      slug,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });

  if (existingQuote) {
    throw new AppError("Quote with similar content already exists", "DUPLICATE_SLUG", 400);
  }
}

export async function validateAccess(quoteId: string, userId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (session.user.role === "ADMIN") return;

  if (session.user.role === "AUTHOR") {
    const hasAccess = await validateQuoteOwnership(quoteId, userId);
    if (!hasAccess) {
      throw new QuoteAccessError();
    }
    return;
  }

  throw new AppError("Permission denied", "FORBIDDEN", 403);
}

export async function validateAuthorProfile(authorProfileId: string): Promise<void> {
  const authorProfile = await db.authorProfile.findUnique({
    where: { id: authorProfileId },
  });

  if (!authorProfile) {
    throw new AppError("Author profile not found", "AUTHOR_PROFILE_NOT_FOUND", 404);
  }
}

export async function validateImages(images: QuoteImageData[]): Promise<void> {
  validateQuoteImages(images);

  for (const image of images) {
    if (!image.url.includes(cloudinaryConfig.cloudName)) {
      throw new AppError(
        "Invalid image URL. Images must be uploaded to Cloudinary",
        "INVALID_IMAGE",
        400
      );
    }
  }
}

export async function validateUpdateData(
  id: string,
  data: UpdateQuoteInput,
  existingQuote: Quote
): Promise<void> {
  if (data.categoryId) {
    await validateCategory(data.categoryId);
  }

  if (data.authorProfileId) {
    await validateAuthorProfile(data.authorProfileId);
  }

  if (data.content) {
    if (data.content.length > 1500) {
      throw new AppError("Quote content exceeds 1500 characters", "CONTENT_TOO_LONG", 400);
    }
    if (data.content === existingQuote.content) {
      throw new AppError("New content is identical to existing content", "NO_CHANGES", 400);
    }
  }

  if (data.slug && data.slug !== existingQuote.slug) {
    await validateSlug(data.slug, id);
  }

  if (!data.content && !data.slug && !data.categoryId && !data.authorProfileId) {
    throw new AppError("No changes provided for update", "NO_CHANGES", 400);
  }
}
