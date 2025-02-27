// app/api/quotes/[slug]/track-download/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import db from "@/lib/prisma";
import type { ApiResponse, QuoteErrorCode } from "@/types/api/quotes";

/**
 * POST handler for tracking quote downloads
 * This is a lightweight endpoint that only increments the download count
 * without requiring any image data transfer
 */
export async function POST(req: Request): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      throw new AppError('Invalid quote slug', 'BAD_REQUEST', 400);
    }
    
    // Find the quote (only get id to keep it lightweight)
    const quote = await db.quote.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!quote) {
      throw new AppError('Quote not found', 'NOT_FOUND', 404);
    }

    // Increment download count atomically
    await db.quote.update({
      where: { id: quote.id },
      data: { downloadCount: { increment: 1 } }
    });
    
    // Optional: Track user ID if authenticated
    const session = await auth();
    if (session?.user) {
      console.log(`Quote ${quote.id} downloaded by user ${session.user.id}`);
    }

    return NextResponse.json({
      data: { success: true }
    });

  } catch (error) {
    console.error('[QUOTE_TRACK_DOWNLOAD]', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR' as QuoteErrorCode, message: 'Failed to track download' } },
      { status: 500 }
    );
  }
}