import { getDailyQuote } from "@/actions/daily-quote";
// import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuotePageClient } from "../quotes/[slug]/components/quote-page-client";
import { LoadingQuote } from "../quotes/[slug]/components/quote-loading";
import { ErrorQuote } from "../quotes/[slug]/components/quote-error";
import { Shell } from "@/components/shells/shell";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quote of the Day | gulfquotes",
  description: "A new inspiring quote every day",
};

export default async function DailyQuotePage() {
  try {
    // Fetch the daily quote
    const { data, error } = await getDailyQuote();
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data?.quote) {
      return <LoadingQuote />;
    }
    
    // Get backgrounds for this quote
    const backgrounds = await quoteDisplayService.getQuoteBackgrounds(data.quote.id);
    
    // Get active background
    const activeBackground = data.quote.gallery.find(g => g.isActive)?.gallery || null;
    
    // Get the display configuration for the quote
    const displayConfig = quoteDisplayService.getDisplayConfig(data.quote);

    return (
      <Shell>
        <div className="flex flex-col gap-4 p-4 md:p-8">
          {/* Daily Quote Badge */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="flex items-center gap-1.5 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Quote of the Day</span>
              <span className="text-xs text-muted-foreground ml-1">
                Refreshes in {new Date(data.expiration).toLocaleDateString()}
              </span>
            </Badge>
          </div>
          
          <div className="mx-auto w-full max-w-7xl">
            <Suspense fallback={<LoadingQuote />}>
              <QuotePageClient 
                quote={data.quote}
                backgrounds={backgrounds}
                activeBackground={activeBackground}
                fontSize={displayConfig.fontSize}
                isDailyQuote={true} // Pass this flag to indicate it's a daily quote
              />
            </Suspense>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[DAILY_QUOTE_PAGE]", error);
    return (
      <ErrorQuote 
        error="Failed to load the daily quote" 
        showRetryButton 
        onRetry={() => window.location.reload()}
      />
    );
  }
}