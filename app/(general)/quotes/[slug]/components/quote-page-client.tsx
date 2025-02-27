"use client"

import React, { useRef, useCallback, useState } from "react";
import { Gallery } from "@prisma/client";
import { QuoteDisplay, ResponsiveQuoteContainer } from "./quote-display";
import { QuoteActions } from "./quote-actions";
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
  // Add local state for active background
  const [localBackground, setLocalBackground] = useState<Gallery | null>(initialBackground);

  // Explicitly type the ref as non-null
  const containerRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;

  // Update to use local state instead of API call - make it async to return a Promise
  const handleBackgroundChange = useCallback(async (background: Gallery) => {
    // Simply update local state - no API call
    setLocalBackground(background);
    // Return a resolved promise to satisfy the interface
    return Promise.resolve();
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 md:py-8">
      {/* Replace single column with grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main content area (left) */}
        <div className="col-span-1 lg:col-span-8">
          {/* Quote display */}
          <div className="space-y-8">
            <ResponsiveQuoteContainer>
              <QuoteDisplay 
                quote={quote}
                fontSize={fontSize}
                backgroundImage={localBackground}
                containerRef={containerRef}
              />
            </ResponsiveQuoteContainer>
            
            {/* On mobile, actions appear below the quote */}
            <div className="block lg:hidden">
              <QuoteActions 
                quote={quote}
                backgrounds={backgrounds}
                activeBackground={localBackground}
                onBackgroundChange={handleBackgroundChange}
                containerRef={containerRef}
              />
            </div>
          </div>
        </div>
        
        {/* Sidebar area (right) */}
        <div className="col-span-1 lg:col-span-4">
          {/* Hidden on mobile since we show actions below quote */}
          <div className="hidden lg:block space-y-6">
            <QuoteActions 
              quote={quote}
              backgrounds={backgrounds}
              activeBackground={localBackground}
              onBackgroundChange={handleBackgroundChange}
              containerRef={containerRef}
            />
            
            {/* We'll add more sidebar components in future steps */}
          </div>
        </div>
      </div>
    </div>
  );
}