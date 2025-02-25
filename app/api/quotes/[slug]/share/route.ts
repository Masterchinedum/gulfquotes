// app/api/quotes/[slug]/share/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import type { ApiResponse } from "@/types/api";

interface QuoteSocialShareBody {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'pinterest';
  imageDataUrl?: string;
}

export async function POST(
  req: Request,
  context: { params: { slug: string } }
): Promise<NextResponse<ApiResponse<{ shareUrl: string }>>> {
  try {
    // Authentication is optional for public quotes
    const session = await auth();
    
    // 1. Get the quote
    const quote = await quoteDisplayService.getQuoteBySlug(context.params.slug);
    
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }
    
    // 2. Parse the request body
    const body = await req.json() as QuoteSocialShareBody;
    
    if (!body.platform) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Social platform is required" } },
        { status: 400 }
      );
    }
    
    // 3. Generate the share URL based on the platform
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quoticon.vercel.app';
    // const baseUrl = 'https://quoticon.com';
    const quoteUrl = `${baseUrl}/quotes/${context.params.slug}`;
    const quoteText = encodeURIComponent(quote.content);
    const authorName = encodeURIComponent(quote.authorProfile?.name || "Unknown");
    
    let shareUrl = '';
    
    switch (body.platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${quoteText}%20-%20${authorName}&url=${quoteUrl}`;
        break;
        
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${quoteUrl}`;
        break;
        
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${quoteUrl}`;
        break;
        
      case 'pinterest':
        // Pinterest requires an image
        if (!body.imageDataUrl) {
          return NextResponse.json(
            { error: { code: "BAD_REQUEST", message: "Image data is required for Pinterest shares" } },
            { status: 400 }
          );
        }
        shareUrl = `https://pinterest.com/pin/create/button/?url=${quoteUrl}&media=${encodeURIComponent(body.imageDataUrl)}&description=${quoteText}%20-%20${authorName}`;
        break;
        
      default:
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Invalid platform specified" } },
          { status: 400 }
        );
    }
    
    // Track the share (optional)
    if (session?.user) {
      // You could add sharing analytics here
      console.log(`Quote ${quote.id} shared on ${body.platform} by user ${session.user.id}`);
    }
    
    return NextResponse.json({
      data: { shareUrl }
    });
    
  } catch (error) {
    console.error("[QUOTE_SHARE]", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate share link" } },
      { status: 500 }
    );
  }
}