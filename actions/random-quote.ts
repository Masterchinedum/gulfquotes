"use server";

import { AppError } from "@/lib/api-error";
import db from "@/lib/prisma";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { revalidatePath } from "next/cache";

/**
 * Response interface for random quote actions
 */
interface RandomQuoteActionResponse {
  data?: {
    quote: QuoteDisplayData;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Get a random quote
 * @param categoryId Optional category ID to filter quotes by category
 */
export async function getRandomQuote(categoryId?: string): Promise<RandomQuoteActionResponse> {
  try {
    // Build the where condition based on whether categoryId is provided
    const whereCondition = categoryId 
      ? { categoryId }
      : {};

    // Count total quotes matching the condition to get a random index
    const count = await db.quote.count({ where: whereCondition });
    
    // If no quotes found, return an error
    if (count === 0) {
      throw new AppError(
        categoryId 
          ? "No quotes found in this category" 
          : "No quotes available", 
        "NOT_FOUND", 
        404
      );
    }
    
    // Get a random index
    const randomIndex = Math.floor(Math.random() * count);
    
    // Fetch a random quote using the random index
    const randomQuote = await db.quote.findMany({
      where: whereCondition,
      take: 1,
      skip: randomIndex,
      select: { slug: true }
    });
    
    if (!randomQuote.length) {
      throw new AppError("Failed to get random quote", "NOT_FOUND", 404);
    }
    
    // Use the quote display service to get full quote details
    const quote = await quoteDisplayService.getQuoteBySlug(randomQuote[0].slug);
    
    if (!quote) {
      throw new AppError("Quote data not found", "NOT_FOUND", 404);
    }
    
    return {
      data: {
        quote,
      },
    };
  } catch (error) {
    console.error("[ACTION_RANDOM_QUOTE_GET]", error);
    
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
    
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
  }
}

/**
 * Get a new random quote and revalidate paths
 * @param categoryId Optional category ID to filter quotes by category
 */
export async function refreshRandomQuote(categoryId?: string): Promise<RandomQuoteActionResponse> {
  const result = await getRandomQuote(categoryId);
  
  if (result.data) {
    // Revalidate relevant paths to ensure fresh content
    revalidatePath("/");
  }
  
  return result;
}