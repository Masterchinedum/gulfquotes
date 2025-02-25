// app/(general)/quotes/[slug]/page.tsx
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import { Metadata } from "next";
import { LoadingQuote } from "./components/quote-loading";
import { ErrorQuote } from "./components/quote-error";
import { QuoteDisplay, ResponsiveQuoteContainer } from "./components/quote-display";

interface QuotePageProps {
  params: {
    slug: string;
  };
}

// Generate dynamic metadata for the quote page
export async function generateMetadata({ params }: QuotePageProps): Promise<Metadata> {
  try {
    const quote = await quoteDisplayService.getQuoteBySlug(params.slug);
    
    if (!quote) {
      return {
        title: "Quote Not Found",
        description: "The quote you're looking for doesn't exist or has been removed."
      };
    }

    return {
      title: `"${quote.content.substring(0, 60)}${quote.content.length > 60 ? '...' : ''}" - ${quote.authorProfile?.name || "Unknown"}`,
      description: `Quote by ${quote.authorProfile?.name || "Unknown"}`,
      openGraph: {
        title: `Quote by ${quote.authorProfile?.name || "Unknown"}`,
        description: quote.content.substring(0, 160),
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Quote by ${quote.authorProfile?.name || "Unknown"}`,
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

export default async function QuotePage({ params }: QuotePageProps) {
  try {
    // Fetch the quote data
    const quote = await quoteDisplayService.getQuoteBySlug(params.slug);
    
    // Handle non-existent quote
    if (!quote) {
      notFound();
    }
    
    // Get the display configuration for the quote
    const displayConfig = quoteDisplayService.getDisplayConfig(quote);

    return (
      <div className="container mx-auto py-8 px-4">
        <Suspense fallback={<LoadingQuote />}>
          <ResponsiveQuoteContainer>
            <QuoteDisplay 
              quote={quote}
              fontSize={displayConfig.fontSize}
              backgroundImage={displayConfig.backgroundImage}
            />
          </ResponsiveQuoteContainer>

          {/* Additional UI will be added in later phases */}
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("[QUOTE_PAGE]", error);
    return <ErrorQuote error={error instanceof Error ? error.message : "An error occurred"} />;
  }
}