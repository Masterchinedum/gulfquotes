// app/(general)/quotes/[slug]/page.tsx
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import { LoadingQuote } from "./components/quote-loading";
import { ErrorQuote } from "./components/quote-error";
import { QuotePageClient } from "./components/quote-page-client";
import { Shell } from "@/components/shells/shell";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for the quote page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const quote = await quoteDisplayService.getQuoteBySlug(resolvedParams.slug);
    
    if (!quote) {
      return {
        title: "Quote Not Found - Quoticon",
        description: "The quote you're looking for doesn't exist or has been removed."
      };
    }

    const authorName = quote.authorProfile?.name || "Unknown";
    const shortContent = quote.content.length > 60 
      ? `${quote.content.substring(0, 57)}...` 
      : quote.content;

    return {
      title: `"${shortContent}" - ${authorName} | Quoticon`,
      description: quote.content.substring(0, 160),
      openGraph: {
        title: `Quote by ${authorName}`,
        description: quote.content.substring(0, 160),
        type: 'article',
        authors: [authorName],
        tags: quote.tags?.map(tag => tag.name) || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Quote by ${authorName}`,
        description: quote.content.substring(0, 160),
      }
    };
  } catch (error) {
    console.error("[QUOTE_PAGE_METADATA]", error);
    return {
      title: "Quote - Quoticon",
      description: "View inspiring quotes on Quoticon"
    };
  }
}

// Interface for error handling
interface QuoteError {
  code?: string;
  message: string;
}

// Type guard for error handling
function isQuoteError(error: unknown): error is QuoteError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

export default async function QuotePage({ params }: PageProps) {
  try {
    // Await the params first
    const resolvedParams = await params;
    
    // Fetch the quote data and backgrounds in parallel
    const [quote, backgrounds] = await Promise.all([
      quoteDisplayService.getQuoteBySlug(resolvedParams.slug),
      quoteDisplayService.getQuoteBackgrounds(resolvedParams.slug)
    ]);
    
    // Handle non-existent quote
    if (!quote) {
      notFound();
    }
    
    // Get active background
    const activeBackground = quote.gallery.find(g => g.isActive)?.gallery || null;
    
    // Get the display configuration for the quote
    const displayConfig = quoteDisplayService.getDisplayConfig(quote);

    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-5xl">
            <Suspense fallback={<LoadingQuote />}>
              <QuotePageClient 
                quote={quote}
                backgrounds={backgrounds}
                activeBackground={activeBackground}
                fontSize={displayConfig.fontSize}
              />
            </Suspense>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[QUOTE_PAGE]", error);

    // Handle specific error cases
    if (isQuoteError(error)) {
      switch (error.code) {
        case "NOT_FOUND":
          notFound();
        case "UNAUTHORIZED":
          return <ErrorQuote 
            error="You don't have permission to view this quote" 
            showBackButton
          />;
        default:
          return <ErrorQuote 
            error={error.message} 
            showRetryButton 
            onRetry={() => window.location.reload()}
          />;
      }
    }

    // Handle generic errors
    return (
      <ErrorQuote 
        error="An unexpected error occurred while loading the quote" 
        showRetryButton 
        onRetry={() => window.location.reload()}
      />
    );
  }
}