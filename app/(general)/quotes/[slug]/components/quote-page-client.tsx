// app/(general)/quotes/[slug]/components/quote-page-client.tsx
"use client"

import React, { useRef, useCallback } from "react";
import { Gallery } from "@prisma/client";
import { QuoteDisplay, ResponsiveQuoteContainer } from "./quote-display";
import { QuoteActions } from "./quote-actions";
import { toast } from "sonner";
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
  activeBackground,
  fontSize,
}: QuotePageClientProps) {
  // Explicitly type the ref as non-null
  const containerRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;

  const handleBackgroundChange = useCallback(async (background: Gallery) => {
    try {
      const response = await fetch(`/api/quotes/${quote.slug}/background`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: background.url 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update background');
      }

      window.location.reload();
    } catch (error) {
      toast.error('Failed to update background');
      console.error('Background update error:', error);
    }
  }, [quote.slug]);

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
          onBackgroundChange={handleBackgroundChange}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
}