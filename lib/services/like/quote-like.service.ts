// lib/services/like/quote-like.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
// import type { QuoteLike } from "@prisma/client";

class QuoteLikeService {
  /**
   * Toggle a like for a quote
   * If the user has already liked the quote, remove the like
   * If the user has not liked the quote, add a like
   */
  async toggleLike(quoteId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      // Check if the quote exists
      const quote = await db.quote.findUnique({
        where: { id: quoteId },
        select: { id: true }
      });
      
      if (!quote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }
      
      // Check if the user has already liked this quote
      const existingLike = await db.quoteLike.findUnique({
        where: {
          quoteId_userId: {
            quoteId,
            userId
          }
        }
      });
      
      // Transaction to ensure count stays in sync
      return await db.$transaction(async (tx) => {
        if (existingLike) {
          // User has already liked this quote, so remove the like
          await tx.quoteLike.delete({
            where: {
              quoteId_userId: {
                quoteId,
                userId
              }
            }
          });
          
          // Decrement the likes counter on the quote
          const updatedQuote = await tx.quote.update({
            where: { id: quoteId },
            data: { 
              likes: { decrement: 1 } 
            },
            select: { likes: true }
          });
          
          return { 
            liked: false, 
            likes: updatedQuote.likes 
          };
        } else {
          // User hasn't liked this quote yet, so add a like
          await tx.quoteLike.create({
            data: {
              quoteId,
              userId
            }
          });
          
          // Increment the likes counter on the quote
          const updatedQuote = await tx.quote.update({
            where: { id: quoteId },
            data: { 
              likes: { increment: 1 } 
            },
            select: { likes: true }
          });
          
          return { 
            liked: true, 
            likes: updatedQuote.likes 
          };
        }
      });
    } catch (error) {
      console.error("Error toggling quote like:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle quote like", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get like status for multiple quotes for a specific user
   */
  async getUserLikes(userId: string, quoteIds: string[]): Promise<Record<string, boolean>> {
    try {
      const likes = await db.quoteLike.findMany({
        where: {
          userId,
          quoteId: { in: quoteIds }
        },
        select: {
          quoteId: true
        }
      });
      
      // Convert to a map of quoteId -> boolean
      const likeMap: Record<string, boolean> = {};
      quoteIds.forEach(id => {
        likeMap[id] = false;
      });
      
      likes.forEach(like => {
        likeMap[like.quoteId] = true;
      });
      
      return likeMap;
    } catch (error) {
      console.error("Error getting user quote likes:", error);
      throw new AppError("Failed to get user quote likes", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get the total number of likes for a quote
   */
  async getLikeCount(quoteId: string): Promise<number> {
    try {
      const quote = await db.quote.findUnique({
        where: { id: quoteId },
        select: { likes: true }
      });
      
      if (!quote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }
      
      return quote.likes;
    } catch (error) {
      console.error("Error getting quote like count:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to get quote like count", "INTERNAL_ERROR", 500);
    }
  }
}

// Create and export singleton instance
const quoteLikeService = new QuoteLikeService();
export default quoteLikeService;