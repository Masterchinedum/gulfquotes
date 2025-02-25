// app/api/quotes/[slug]/download/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import type { ApiResponse, QuoteErrorCode } from "@/types/api/quotes";

interface QuoteDownloadBody {
  dataUrl: string;
  format: 'png' | 'jpg';
  quality?: number;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  try {
    // Authentication is optional for public quotes
    const session = await auth();
    
    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Invalid quote slug" } },
        { status: 400 }
      );
    }
    
    // 1. Get the quote from the database
    const quote = await quoteDisplayService.getQuoteBySlug(slug);
    
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND" as QuoteErrorCode, message: "Quote not found" } },
        { status: 404 }
      );
    }
    
    // 2. Parse the request body
    const body = await req.json() as QuoteDownloadBody;
    
    if (!body.dataUrl) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Image data is required" } },
        { status: 400 }
      );
    }
    
    // Track the download (optional)
    if (session?.user) {
      // You could add download analytics here
      console.log(`Quote ${quote.id} downloaded by user ${session.user.id}`);
    }

    return NextResponse.json({
      data: { 
        url: body.dataUrl 
      }
    });
    
  } catch (error) {
    console.error("[QUOTE_DOWNLOAD]", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Failed to generate download" } },
      { status: 500 }
    );
  }
}