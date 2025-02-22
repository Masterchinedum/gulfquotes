// app/actions/quote.ts
import db from "@/lib/prisma";
import { Quote, QuoteToGallery, Gallery } from "@prisma/client";

export type QuoteWithRelations = Quote & {
  authorProfile: {
    name: string;
    slug: string;
    images: {
      url: string;
    }[];
  };
  category: {
    name: string;
    slug: string;
  };
  gallery: (QuoteToGallery & {
    gallery: Gallery;
  })[];
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export async function getQuoteBySlug(slug: string): Promise<QuoteWithRelations | null> {
  try {
    const quote = await db.quote.findUnique({
      where: { slug },
      include: {
        authorProfile: {
          select: {
            name: true,
            slug: true,
            images: {
              select: {
                url: true,
              },
              take: 1, // Only take the first image as profile image
            },
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        gallery: {
          include: {
            gallery: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return quote;
  } catch (error) {
    console.error("[QUOTE_GET_BY_SLUG]", error);
    return null;
  }
}