// app/(general)/quotes/[slug]/components/quote-page-client.tsx
"use client"

import React, { useRef, useCallback, useState } from "react"; // Added useState
import { Gallery } from "@prisma/client";
import { QuoteDisplay, ResponsiveQuoteContainer } from "./quote-display";
import { QuoteActions } from "./quote-actions";
// import { toast } from "sonner";
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
  activeBackground: initialBackground, // Rename to indicate it's the initial value
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
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <ResponsiveQuoteContainer>
          <QuoteDisplay 
            quote={quote}
            fontSize={fontSize}
            backgroundImage={localBackground} // Use local state instead of prop
            containerRef={containerRef}
          />
        </ResponsiveQuoteContainer>

        <QuoteActions 
          quote={quote}
          backgrounds={backgrounds}
          activeBackground={localBackground} // Use local state instead of prop
          onBackgroundChange={handleBackgroundChange}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
}