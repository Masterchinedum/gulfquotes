//app/(general)/quotes/[slug]/components/quote-display.tsx

"use client";

import { useState } from "react";
import { BackgroundGallery } from "./background-gallery";
import { QuoteImage } from "./quote-image";
import Image from "next/image"; 
import type { GalleryItem } from "@/types/gallery";
import type { Quote, AuthorProfile, Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface QuoteDisplayProps {
  quote: Quote & {
    authorProfile: AuthorProfile;
    category: Category;
  };
  className?: string;
}

export function QuoteDisplay({ quote: initialQuote, className }: QuoteDisplayProps) {
  const [quote, setQuote] = useState(initialQuote);

  const handleBackgroundSelect = async (image: GalleryItem) => {
    try {
      const response = await fetch(`/api/quotes/${quote.slug}/background`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: image.url })
      });

      if (!response.ok) throw new Error('Failed to update background');

      const data = await response.json();
      setQuote(data.data);
    } catch (error) {
      console.error('Failed to update background:', error);
    }
  };

  const handleBackgroundRemove = async () => {
    try {
      const response = await fetch(`/api/quotes/${quote.slug}/background`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null })
      });

      if (!response.ok) throw new Error('Failed to remove background');

      const data = await response.json();
      setQuote(data.data);
    } catch (error) {
      console.error('Failed to remove background:', error);
    }
  };

  // Get the first author image if available
  const authorImage = quote.authorProfile.images?.[0]?.url;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Quote Image Version */}
      <QuoteImage quote={quote} />

      {/* Background Selection */}
      <BackgroundGallery
        currentBackground={quote.backgroundImage}
        onSelect={handleBackgroundSelect}
        onRemove={handleBackgroundRemove}
      />

      {/* Text Quote Version */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <blockquote className="text-xl mb-4">
          &quot;{quote.content}&quot;
        </blockquote>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
            {authorImage && (
              <Image
                src={authorImage}
                alt={quote.authorProfile.name}
                width={40}
                height={40}
                className="object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{quote.authorProfile.name}</h2>
            <p className="text-sm text-muted-foreground">{quote.category.name}</p>
          </div>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share quote text</span>
          </Button>
        </div>
      </div>
    </div>
  );
}