// app/api/quotes/[slug]/download/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import type { ApiResponse, QuoteErrorCode } from "@/types/api/quotes";

// Quality presets for different optimization targets
const QUALITY_PRESETS = {
  high: {
    width: 1080 * 3, // 3x for high resolution
    height: 1080 * 3,
    quality: 1.0,
    scale: 3,
    format: 'png' as const
  },
  standard: {
    width: 1080 * 2, // 2x for standard resolution
    height: 1080 * 2,
    quality: 0.9,
    scale: 2,
    format: 'png' as const
  },
  web: {
    width: 1080 * 1.5, // 1.5x for web optimization
    height: 1080 * 1.5,
    quality: 0.8,
    scale: 1.5,
    format: 'webp' as const
  }
};

interface QuoteDownloadBody {
  imageData: string;
  optimizeFor?: 'high' | 'standard' | 'web';
  format?: 'png' | 'jpg' | 'webp';
  customSettings?: {
    width?: number;
    height?: number;
    quality?: number;
    scale?: number;
  };
}

// Normalize settings with fallback to presets
function normalizeSettings(body: QuoteDownloadBody) {
  const preset = QUALITY_PRESETS[body.optimizeFor || 'standard'];
  const custom = body.customSettings || {};

  return {
    width: custom.width || preset.width,
    height: custom.height || preset.height,
    quality: custom.quality || preset.quality,
    scale: custom.scale || preset.scale,
    format: body.format || preset.format
  };
}

// Process image using Next.js Image Optimization API
async function optimizeImage(imageData: string, settings: ReturnType<typeof normalizeSettings>) {
  try {
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Use Next.js Image Optimization API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/_next/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: buffer.toString('base64'),
        width: settings.width,
        height: settings.height,
        quality: Math.round(settings.quality * 100),
        format: settings.format,
      }),
    });

    if (!response.ok) {
      throw new Error('Image optimization failed');
    }

    const optimizedBuffer = await response.arrayBuffer();
    return Buffer.from(optimizedBuffer).toString('base64');
  } catch (error) {
    console.error('Image optimization error:', error);
    throw new AppError(
      'Failed to optimize image', 
      'IMAGE_PROCESSING_FAILED', // Using a valid error code
      500
    );
  }
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  try {
    // Authentication is optional for public quotes
    const session = await auth();
    
    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      throw new AppError('Invalid quote slug', 'BAD_REQUEST', 400);
    }
    
    // Get quote data
    const quote = await quoteDisplayService.getQuoteBySlug(slug);
    if (!quote) {
      throw new AppError('Quote not found', 'NOT_FOUND', 404);
    }
    
    // Parse request body
    const body = await req.json() as QuoteDownloadBody;
    if (!body.imageData) {
      throw new AppError('Image data is required', 'BAD_REQUEST', 400);
    }

    // Get normalized settings
    const settings = normalizeSettings(body);

    // Process image
    const optimizedImageData = await optimizeImage(body.imageData, settings);

    // Create data URL with proper mime type
    const mimeType = settings.format === 'jpg' ? 'jpeg' : settings.format;
    const dataUrl = `data:image/${mimeType};base64,${optimizedImageData}`;

    // Track download (optional)
    if (session?.user) {
      console.log(`Quote ${quote.id} downloaded by user ${session.user.id}`);
    }

    return NextResponse.json({
      data: { url: dataUrl }
    });

  } catch (error) {
    console.error('[QUOTE_DOWNLOAD]', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR' as QuoteErrorCode, message: 'Failed to generate download' } },
      { status: 500 }
    );
  }
}