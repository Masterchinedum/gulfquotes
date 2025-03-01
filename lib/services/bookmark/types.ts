// Create this file at: /lib/services/bookmark/types.ts

import { QuoteBookmark } from "@prisma/client";
import { Quote } from "@prisma/client";

/**
 * Record that maps quote IDs to their bookmark status (true/false)
 */
export type BookmarkStatusMap = Record<string, boolean>;

/**
 * Interface for bookmark toggle response
 */
export interface BookmarkToggleResponse {
  bookmarked: boolean;
  bookmarks: number;
}

/**
 * Interface for the quote bookmark service
 */
export interface BookmarkService {
  /**
   * Toggle a bookmark for a quote (add if not exists, remove if exists)
   */
  toggleBookmark(quoteId: string, userId: string): Promise<BookmarkToggleResponse>;
  
  /**
   * Check if a specific quote is bookmarked by a user
   */
  getBookmarkStatus(quoteId: string, userId: string): Promise<boolean>;
  
  /**
   * Get bookmark status for multiple quotes at once
   */
  getUserBookmarks(userId: string, quoteIds: string[]): Promise<BookmarkStatusMap>;
  
  /**
   * Get current bookmark count for a quote
   */
  getQuoteBookmarkCount(quoteId: string): Promise<number>;
  
  /**
   * Create a bookmark
   */
  createBookmark(quoteId: string, userId: string): Promise<QuoteBookmark>;
  
  /**
   * Delete a bookmark
   */
  deleteBookmark(quoteId: string, userId: string): Promise<void>;
  
  /**
   * Get all quotes bookmarked by a user
   */
  getBookmarkedQuotes(userId: string, page?: number, limit?: number): Promise<{
    items: Quote[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }>;
}