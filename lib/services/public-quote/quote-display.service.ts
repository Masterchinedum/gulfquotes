// lib/services/public-quote/quote-display.service.ts

import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import type { Quote, Gallery } from "@prisma/client";
import html2canvas from 'html2canvas';
// Add imports for services
import { quoteBookmarkService } from "@/lib/services/bookmark";
import { quoteLikeService } from "@/lib/services/like"; // Add this line
import { authorFollowService } from "@/lib/services/follow"; // Add this import at the top of the file

export interface QuoteDisplayData extends Quote {
  authorProfile: {
    name: string;
    slug: string;
    image?: string | null; 
    bio?: string | null;  // Add bio field
    quoteCount?: number; // Add quoteCount field
    followers?: number;      // Add followers count
    isFollowed?: boolean;    // Add follow status
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
  backgroundImage: string | null;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  metrics?: {
    views: number;
    likes: number;
    shares: number;
    bookmarks?: number; // Add this line
  };
  isLiked?: boolean;
  isBookmarked?: boolean; // Add this line
}

class QuoteDisplayService {
  /**
   * Fetch a quote by its slug with necessary relations
   */
  async getQuoteBySlug(slug: string, userId?: string): Promise<QuoteDisplayData | null> {
    try {
      const quote = await db.quote.findUnique({
        where: { slug },
        include: {
          authorProfile: {
            select: {
              id: true,  // Make sure to include id
              name: true,
              slug: true,
              bio: true,
              followers: true,  // Add followers count
              images: {
                select: {
                  url: true
                },
                take: 1
              },
              _count: {
                select: {
                  quotes: true
                }
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
            // Remove isBackground filter to get all images
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

      // If userId is provided, get like, bookmark, and follow status
      let isLiked = false;
      let isBookmarked = false;
      let isFollowed = false;
      
      if (userId) {
        const [likeStatus, bookmarkStatus, followStatus] = await Promise.all([
          quoteLikeService.getUserLikes(userId, [quote.id]),
          quoteBookmarkService.getUserBookmarks(userId, [quote.id]),
          authorFollowService.getFollowStatus(quote.authorProfile.id, userId)
        ]);
        
        isLiked = likeStatus[quote.id] || false;
        isBookmarked = bookmarkStatus[quote.id] || false;
        isFollowed = followStatus;
      }

      // Transform the data to match QuoteDisplayData interface
      const transformedQuote = {
        ...quote,
        authorProfile: {
          ...quote.authorProfile,
          image: quote.authorProfile.images[0]?.url || null,
          images: undefined, // Remove the images array from the transformed data
          isFollowed,       // Add follow status
        },
        isLiked,
        isBookmarked
      };

      return {
        ...transformedQuote,
        authorProfile: {
          ...transformedQuote.authorProfile,
          quoteCount: quote.authorProfile._count.quotes
        }
      } as QuoteDisplayData;
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
      // Get both quote-specific and global backgrounds
      const [quoteBackgrounds, globalBackgrounds] = await Promise.all([
        // Get quote's gallery images
        db.quoteToGallery.findMany({
          where: { 
            quoteId,
            gallery: {
              // Only get images suitable for backgrounds
              width: { gte: 800 },
              height: { gte: 500 }
            }
          },
          include: {
            gallery: true
          }
        }),
        // Get global backgrounds not already associated with the quote
        db.gallery.findMany({
          where: {
            isGlobal: true,
            width: { gte: 800 },
            height: { gte: 500 },
            NOT: {
              quotes: {
                some: {
                  quoteId
                }
              }
            }
          }
        })
      ]);

      // Combine and deduplicate backgrounds
      const backgrounds = [
        ...quoteBackgrounds.map(qb => qb.gallery),
        ...globalBackgrounds
      ];

      // Remove duplicates based on id
      return Array.from(
        new Map(backgrounds.map(bg => [bg.id, bg])).values()
      );
    } catch (error) {
      console.error("[QUOTE_DISPLAY_SERVICE] Background fetch error:", error);
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