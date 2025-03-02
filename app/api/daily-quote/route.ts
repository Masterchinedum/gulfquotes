// app/api/daily-quote/route.ts
import { NextResponse } from "next/server";
import { dailyQuoteService } from "@/lib/services/daily-quote";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import db from "@/lib/prisma";
import type { QuoteErrorCode } from "@/types/api/quotes";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

// Define response type
interface DailyQuoteResponse {
  data?: {
    quote: QuoteDisplayData;
    expiration: string; // ISO string date when the quote will expire
  };
  error?: {
    code: QuoteErrorCode;
    message: string;
  };
}

// Enable Next.js cache with revalidation
export const revalidate = 3600; // Revalidate cache every hour

/**
 * GET endpoint to fetch the current daily quote
 */
export async function GET(): Promise<NextResponse<DailyQuoteResponse>> {
  try {
    // Get the current daily quote
    const quote = await dailyQuoteService.getCurrentDailyQuote();
    
    // Get the expiration date
    const dailyQuoteRecord = await db.dailyQuote.findFirst({
      where: {
        quoteId: quote.id,
        isActive: true
      },
      orderBy: {
        selectionDate: 'desc'
      }
    });
    
    if (!dailyQuoteRecord) {
      throw new AppError("Daily quote record not found", "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({
      data: {
        quote,
        expiration: dailyQuoteRecord.expirationDate.toISOString()
      }
    });
  } catch (error) {
    console.error("[DAILY_QUOTE_GET]", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to manually trigger a new daily quote selection
 * This is protected and should only be accessible to admins
 */
export async function POST(): Promise<NextResponse<DailyQuoteResponse>> {
  try {
    // Check authentication and permissions
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Authentication required" } },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN" as QuoteErrorCode, message: "Admin permissions required" } },
        { status: 403 }
      );
    }

    // Force select a new daily quote
    const quote = await dailyQuoteService.selectNewDailyQuote();
    
    // Get the expiration date
    const dailyQuoteRecord = await db.dailyQuote.findFirst({
      where: {
        quoteId: quote.id,
        isActive: true
      }
    });
    
    if (!dailyQuoteRecord) {
      throw new AppError("Daily quote record not found", "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({
      data: {
        quote,
        expiration: dailyQuoteRecord.expirationDate.toISOString()
      }
    });
  } catch (error) {
    console.error("[DAILY_QUOTE_POST]", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}