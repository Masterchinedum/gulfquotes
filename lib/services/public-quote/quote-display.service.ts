// lib/services/public-quote/quote-display.service.ts

import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import type { Quote, Gallery } from "@prisma/client";
import html2canvas from 'html2canvas';

export interface QuoteDisplayData extends Quote {
  authorProfile: {
    name: string;
    slug: string;
    image?: string | null; // Add image property
    bio?: string | null;  // Add bio field
  };
  category: {
    name: string;
    slug: string;
  };
  gallery: Array<{
    gallery: Gallery;
    isActive: boolean;
    isBackground: boolean;
  }>;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  metrics?: {
    views: number;
    likes: number;
    shares: number;
  };
}

class QuoteDisplayService {
  /**
   * Fetch a quote by its slug with necessary relations
   */
  async getQuoteBySlug(slug: string): Promise<QuoteDisplayData | null> {
    try {
      const quote = await db.quote.findUnique({
        where: { slug },
        include: {
          authorProfile: {
            select: {
              name: true,
              slug: true,
              bio: true,
              images: {
                select: {
                  url: true
                },
                take: 1
              }
            }
          },
          category: {
            select: {
              name: true,
              slug: true,
            }
          },
          gallery: {
            where: {
              isBackground: true
            },
            include: {
              gallery: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
        }
      });

      if (!quote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }

      // Transform the data to match QuoteDisplayData interface
      const transformedQuote = {
        ...quote,
        authorProfile: {
          ...quote.authorProfile,
          image: quote.authorProfile.images[0]?.url || null,
          images: undefined // Remove the images array from the transformed data
        }
      };

      return transformedQuote as QuoteDisplayData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch quote", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Get available backgrounds for a quote
   */
  async getQuoteBackgrounds(quoteId: string): Promise<Gallery[]> {
    try {
      const galleries = await db.quoteToGallery.findMany({
        where: { 
          quoteId,
          isBackground: true,
          gallery: {
            isGlobal: true
          }
        },
        include: {
          gallery: true
        }
      });

      return galleries.map(g => g.gallery);
    } catch {
      throw new AppError("Failed to fetch backgrounds", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Get font size based on text length
   */
  getFontSize(textLength: number): number {
    if (textLength <= 100) return 45;
    if (textLength <= 240) return 41;
    if (textLength <= 300) return 40;
    if (textLength <= 350) return 39;
    if (textLength <= 400) return 38;
    if (textLength <= 450) return 36;
    if (textLength <= 500) return 35;
    if (textLength <= 550) return 33;
    if (textLength <= 600) return 31;
    return 30;
  }

  /**
   * Get canvas dimensions
   */
  getCanvasDimensions() {
    return {
      width: 1080,
      height: 1080,
      padding: 40
    };
  }

  /**
   * Generate quote display configuration
   */
  getDisplayConfig(quote: QuoteDisplayData) {
    return {
      dimensions: this.getCanvasDimensions(),
      fontSize: this.getFontSize(quote.content.length),
      padding: 40,
      backgroundImage: quote.gallery.find(g => g.isActive)?.gallery.url || null,
    };
  }

  /**
   * Generate download image
   */
  async generateDownloadImage(element: HTMLElement): Promise<string> {
    try {
      const canvas = await html2canvas(element, {
        width: 1080,
        height: 1080,
        scale: 2, // Higher quality
        useCORS: true, // Handle cross-origin images
        allowTaint: true,
        backgroundColor: null,
      });

      return canvas.toDataURL('image/png');
    } catch {
      throw new AppError("Failed to generate image", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Update active background
   */
  async updateActiveBackground(quoteId: string, galleryId: string): Promise<void> {
    try {
      // Reset all backgrounds to inactive
      await db.quoteToGallery.updateMany({
        where: { 
          quoteId,
          isBackground: true 
        },
        data: { isActive: false }
      });

      // Set new active background
      await db.quoteToGallery.update({
        where: {
          quoteId_galleryId: {
            quoteId,
            galleryId
          }
        },
        data: { isActive: true }
      });
    } catch {
      throw new AppError("Failed to update background", "INTERNAL_ERROR", 500);
    }
  }
}

// Export service instance
export const quoteDisplayService = new QuoteDisplayService();