// lib/services/daily-quote.ts
// import { addDays } from "date-fns";
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { Prisma } from "@prisma/client";
import type { Quote, DailyQuote } from "@prisma/client";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

export interface DailyQuoteService {
  getCurrentDailyQuote(): Promise<QuoteDisplayData>;
  selectNewDailyQuote(): Promise<QuoteDisplayData>;
  getQuoteHistory(limit?: number): Promise<DailyQuote[]>;
}

class DailyQuoteServiceImpl implements DailyQuoteService {
  /**
   * Get the current daily quote
   * If no active daily quote exists or it's expired, select a new one
   */
  async getCurrentDailyQuote(): Promise<QuoteDisplayData> {
    try {
      // Find the current active daily quote
      const activeDailyQuote = await db.dailyQuote.findFirst({
        where: {
          isActive: true,
          expirationDate: {
            gt: new Date()
          }
        },
        orderBy: {
          selectionDate: 'desc'
        },
        include: {
          quote: true
        }
      });

      // If an active quote exists, return it
      if (activeDailyQuote) {
        return await quoteDisplayService.getQuoteBySlug(activeDailyQuote.quote.slug);
      }

      // Otherwise, select a new daily quote
      return await this.selectNewDailyQuote();
    } catch (error) {
      console.error("Error getting current daily quote:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get daily quote", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Select a new daily quote
   * The quote should not have been used in the last 30 days
   */
  async selectNewDailyQuote(): Promise<QuoteDisplayData> {
    try {
      // Begin a transaction
      return await db.$transaction(async (tx) => {
        // Mark all active daily quotes as inactive
        await tx.dailyQuote.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });

        // Get IDs of quotes used in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentlyUsedQuotes = await tx.dailyQuote.findMany({
          where: {
            selectionDate: {
              gte: thirtyDaysAgo
            }
          },
          select: {
            quoteId: true
          }
        });
        
        const excludedIds = recentlyUsedQuotes.map(q => q.quoteId);

        // Find eligible quotes
        const eligibleQuotes = await tx.quote.findMany({
          where: {
            id: {
              notIn: excludedIds.length > 0 ? excludedIds : undefined
            }
          },
          select: {
            id: true,
            slug: true
          }
        });

        if (eligibleQuotes.length === 0) {
          // If no eligible quotes, get quotes used least recently
          const quote = await tx.quote.findFirst({
            orderBy: {
              dailyQuoteHistory: {
                _max: {
                  selectionDate: 'asc'
                }
              }
            }
          });
          
          if (!quote) {
            throw new AppError("No quotes available in the database", "NOT_FOUND", 404);
          }
          
          return this.createNewDailyQuote(tx, quote);
        }

        // Select a random quote from eligible quotes
        const randomIndex = Math.floor(Math.random() * eligibleQuotes.length);
        const selectedQuote = eligibleQuotes[randomIndex];
        
        // Get the full quote
        const quote = await tx.quote.findUnique({
          where: { id: selectedQuote.id }
        });
        
        if (!quote) {
          throw new AppError("Selected quote not found", "NOT_FOUND", 404);
        }

        return this.createNewDailyQuote(tx, quote);
      });
    } catch (error) {
      console.error("Error selecting new daily quote:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to select new daily quote", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Get history of daily quotes
   */
  async getQuoteHistory(limit = 30): Promise<DailyQuote[]> {
    try {
      return await db.dailyQuote.findMany({
        orderBy: {
          selectionDate: 'desc'
        },
        take: limit,
        include: {
          quote: {
            include: {
              authorProfile: true,
              category: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error getting daily quote history:", error);
      throw new AppError("Failed to get daily quote history", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Helper method to create a new daily quote record
   */
  private async createNewDailyQuote(
    tx: Prisma.TransactionClient,
    quote: Quote
  ): Promise<QuoteDisplayData> {
    // Calculate midnight in UTC+4 timezone
    const now = new Date();
    const expirationDate = this.getNextMidnight();

    // Create new daily quote record
    await tx.dailyQuote.create({
      data: {
        quoteId: quote.id,
        selectionDate: now,
        expirationDate,
        isActive: true
      }
    });

    return await quoteDisplayService.getQuoteBySlug(quote.slug);
  }

  /**
   * Calculate the next midnight in UTC+4 timezone
   */
  private getNextMidnight(): Date {
    const now = new Date();
    
    // Calculate tomorrow's date
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set time to midnight (00:00:00)
    tomorrow.setHours(0, 0, 0, 0);
    
    // Adjust for UTC+4 timezone
    // Get the offset in minutes between UTC and UTC+4
    const utcOffset = 4 * 60; // 4 hours in minutes
    
    // Adjust time to be midnight in UTC+4
    // This means subtracting 4 hours from UTC midnight to get the equivalent UTC time
    tomorrow.setMinutes(tomorrow.getMinutes() - utcOffset);
    
    return tomorrow;
  }
}

// Export service instance
export const dailyQuoteService = new DailyQuoteServiceImpl();