"use client"

import React, { useRef, useCallback, useState } from "react";
import { Gallery } from "@prisma/client";
import { QuoteDisplay, ResponsiveQuoteContainer } from "./quote-display";
import { QuoteActions } from "./quote-actions";
import { QuoteInfoEnhanced } from "./quote-info-enhanced";
import { QuoteComments } from "./comments/quote-comments";
import { RelatedQuotes } from "./related-quotes";
// import { QuoteLikeButton } from "./quote-like-button";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuotePageClientProps {
  quote: QuoteDisplayData;
  backgrounds: Gallery[];
  activeBackground: Gallery | null;
  fontSize: number;
}

export function QuotePageClient({
  quote,
  backgrounds,
  activeBackground: initialBackground,
  fontSize,
}: QuotePageClientProps) {
  // Add memoization to prevent unnecessary updates
  const [localBackground, setLocalBackground] = useState<Gallery | null>(initialBackground);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize the background change handler
  const handleBackgroundChange = useCallback(async (background: Gallery) => {
    try {
      // Use a function updater to avoid dependency on localBackground
      setLocalBackground((current) => {
        // Only update if background actually changed
        if (background.id !== current?.id) {
          return background;
        }
        return current; // No change needed
      });
    } catch (error) {
      console.error("Failed to update background:", error);
    }
  }, []); // Empty dependency array since we use a function updater

  return (
    <div className="container mx-auto py-6 px-4 md:py-8">
      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Main content area (left) */}
        <div className="col-span-1 lg:col-span-8 space-y-8">
          {/* Quote display section */}
          <div className="bg-background rounded-lg overflow-hidden">
            <ResponsiveQuoteContainer>
              <QuoteDisplay 
                quote={quote}
                fontSize={fontSize}
                backgroundImage={localBackground}
                containerRef={containerRef as React.RefObject<HTMLDivElement>}
              />
            </ResponsiveQuoteContainer>
          </div>
          
          {/* Enhanced Quote Information */}
          <QuoteInfoEnhanced quote={quote} />
          
          {/* On mobile, actions appear below the quote */}
          <div className="block lg:hidden">
            <QuoteActions 
              quote={quote}
              backgrounds={backgrounds}
              activeBackground={localBackground}
              onBackgroundChange={handleBackgroundChange}
              containerRef={containerRef as React.RefObject<HTMLDivElement>}
            />
          </div>

          {/* Related quotes on mobile only */}
          <div className="block lg:hidden">
            <RelatedQuotes
              currentQuoteId={quote.id}
              categoryId={quote.categoryId} // Add the categoryId prop here
              authorProfileId={quote.authorProfileId}
              authorName={quote.authorProfile.name}
              authorSlug={quote.authorProfile.slug}
              tags={quote.tags || []}
              limit={2} // Show fewer on mobile
            />
          </div>
          
          {/* Comments Section */}
          <QuoteComments />
        </div>
        
        {/* Sidebar area (right) */}
        <div className="col-span-1 lg:col-span-4">
          <div className="hidden lg:flex flex-col gap-6 sticky top-24">
            {/* Quote actions in sidebar */}
            <QuoteActions 
              quote={quote}
              backgrounds={backgrounds}
              activeBackground={localBackground}
              onBackgroundChange={handleBackgroundChange}
              containerRef={containerRef as React.RefObject<HTMLDivElement>}
            />
            
            {/* Related quotes component */}
            <RelatedQuotes
              currentQuoteId={quote.id}
              categoryId={quote.categoryId} // Add the categoryId prop here
              authorProfileId={quote.authorProfileId}
              authorName={quote.authorProfile.name}
              authorSlug={quote.authorProfile.slug}
              tags={quote.tags || []}
              limit={3} // Show more on desktop
            />
          </div>
        </div>
      </div>
    </div>
  );
}