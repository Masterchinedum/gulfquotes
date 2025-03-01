import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { Prisma, QuoteBookmark } from "@prisma/client";
import { BookmarkService, BookmarkStatusMap, BookmarkToggleResponse } from "./types";

class QuoteBookmarkServiceImpl implements BookmarkService {
  /**
   * Toggle a bookmark for a quote
   * If the user has already bookmarked the quote, remove the bookmark
   * If the user has not bookmarked the quote, add a bookmark
   */
  async toggleBookmark(quoteId: string, userId: string): Promise<BookmarkToggleResponse> {
    try {
      // Check if the quote exists
      const quote = await db.quote.findUnique({
        where: { id: quoteId },
        select: { id: true }
      });
      
      if (!quote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }
      
      // Check if the user has already bookmarked this quote
      const existingBookmark = await db.quoteBookmark.findUnique({
        where: {
          quoteId_userId: {
            quoteId,
            userId
          }
        }
      });
      
      // Transaction to ensure count stays in sync
      return await db.$transaction(async (tx: Prisma.TransactionClient) => {
        if (existingBookmark) {
          // User has already bookmarked this quote, so remove the bookmark
          await tx.quoteBookmark.delete({
            where: {
              quoteId_userId: {
                quoteId,
                userId
              }
            }
          });
          
          // Decrement the bookmarks counter on the quote
          const updatedQuote = await tx.quote.update({
            where: { id: quoteId },
            data: { 
              bookmarks: { decrement: 1 } 
            },
            select: { bookmarks: true }
          });
          
          return { 
            bookmarked: false, 
            bookmarks: updatedQuote.bookmarks 
          };
        } else {
          // User hasn't bookmarked this quote yet, so add a bookmark
          await tx.quoteBookmark.create({
            data: {
              quoteId,
              userId
            }
          });
          
          // Increment the bookmarks counter on the quote
          const updatedQuote = await tx.quote.update({
            where: { id: quoteId },
            data: { 
              bookmarks: { increment: 1 } 
            },
            select: { bookmarks: true }
          });
          
          return { 
            bookmarked: true, 
            bookmarks: updatedQuote.bookmarks 
          };
        }
      });
    } catch (error) {
      console.error("Error toggling quote bookmark:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle quote bookmark", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Check if a specific quote is bookmarked by a user
   */
  async getBookmarkStatus(quoteId: string, userId: string): Promise<boolean> {
    try {
      const bookmark = await db.quoteBookmark.findUnique({
        where: {
          quoteId_userId: {
            quoteId,
            userId
          }
        }
      });
      
      return !!bookmark;
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      throw new AppError("Failed to check bookmark status", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get bookmark status for multiple quotes for a specific user
   */
  async getUserBookmarks(userId: string, quoteIds: string[]): Promise<BookmarkStatusMap> {
    try {
      const bookmarks = await db.quoteBookmark.findMany({
        where: {
          userId,
          quoteId: { in: quoteIds }
        },
        select: {
          quoteId: true
        }
      });
      
      // Convert to a map of quoteId -> boolean
      const bookmarkMap: BookmarkStatusMap = {};
      quoteIds.forEach(id => {
        bookmarkMap[id] = false;
      });
      
      bookmarks.forEach((bookmark: { quoteId: string }) => {
        bookmarkMap[bookmark.quoteId] = true;
      });
      
      return bookmarkMap;
    } catch (error) {
      console.error("Error getting user quote bookmarks:", error);
      throw new AppError("Failed to get user quote bookmarks", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get the total number of bookmarks for a quote
   */
  async getQuoteBookmarkCount(quoteId: string): Promise<number> {
    try {
      const result = await db.quote.findUnique({
        where: { id: quoteId },
        select: { bookmarks: true }
      });
      
      return result?.bookmarks || 0;
    } catch (error) {
      console.error("Error getting quote bookmark count:", error);
      throw new AppError("Failed to get quote bookmark count", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Create a bookmark
   */
  async createBookmark(quoteId: string, userId: string): Promise<QuoteBookmark> {
    try {
      // Check if the quote exists
      const quote = await db.quote.findUnique({
        where: { id: quoteId },
        select: { id: true }
      });
      
      if (!quote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }
      
      // Create bookmark and increment counter in a transaction
      return await db.$transaction(async (tx: Prisma.TransactionClient) => {
        const bookmark = await tx.quoteBookmark.create({
          data: {
            quoteId,
            userId
          }
        });
        
        await tx.quote.update({
          where: { id: quoteId },
          data: { bookmarks: { increment: 1 } }
        });
        
        return bookmark;
      });
    } catch (error) {
      console.error("Error creating quote bookmark:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violations (user already bookmarked this quote)
        if (error.code === 'P2002') {
          throw new AppError("You have already bookmarked this quote", "BAD_REQUEST", 400);
        }
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create quote bookmark", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Delete a bookmark
   */
  async deleteBookmark(quoteId: string, userId: string): Promise<void> {
    try {
      // Check if the bookmark exists
      const bookmark = await db.quoteBookmark.findUnique({
        where: {
          quoteId_userId: {
            quoteId,
            userId
          }
        }
      });
      
      if (!bookmark) {
        throw new AppError("Bookmark not found", "NOT_FOUND", 404);
      }
      
      // Delete bookmark and decrement counter in a transaction
      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.quoteBookmark.delete({
          where: {
            quoteId_userId: {
              quoteId,
              userId
            }
          }
        });
        
        await tx.quote.update({
          where: { id: quoteId },
          data: { bookmarks: { decrement: 1 } }
        });
      });
    } catch (error) {
      console.error("Error deleting quote bookmark:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete quote bookmark", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get all quotes bookmarked by a user
   */
  async getBookmarkedQuotes(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [items, total] = await Promise.all([
        db.quote.findMany({
          where: {
            userBookmarks: {
              some: {
                userId
              }
            }
          },
          include: {
            authorProfile: true,
            category: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        db.quoteBookmark.count({
          where: { userId }
        })
      ]);
      
      return {
        items,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("Error getting bookmarked quotes:", error);
      throw new AppError("Failed to get bookmarked quotes", "INTERNAL_ERROR", 500);
    }
  }
}

export const quoteBookmarkService = new QuoteBookmarkServiceImpl();