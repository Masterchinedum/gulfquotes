// app/(general)/quotes/[slug]/components/quote-page-client.tsx
"use client"

import React, { useRef } from "react";
import { Gallery } from "@prisma/client";
// import { LoadingQuote } from "./quote-loading";
import { QuoteDisplay, ResponsiveQuoteContainer } from "./quote-display";
import { QuoteActions } from "./quote-actions";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuotePageClientProps {
  quote: QuoteDisplayData;
  backgrounds: Gallery[];
  activeBackground: Gallery | null;
  fontSize: number;
  onBackgroundChange: (background: Gallery) => Promise<void>;
}

export function QuotePageClient({
  quote,
  backgrounds,
  activeBackground,
  fontSize,
  onBackgroundChange,
}: QuotePageClientProps) {
  // Create ref for the quote container
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <ResponsiveQuoteContainer>
          <QuoteDisplay 
            quote={quote}
            fontSize={fontSize}
            backgroundImage={activeBackground}
            containerRef={containerRef}
          />
        </ResponsiveQuoteContainer>

        <QuoteActions 
          quote={quote}
          backgrounds={backgrounds}
          activeBackground={activeBackground}
          onBackgroundChange={onBackgroundChange}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
}