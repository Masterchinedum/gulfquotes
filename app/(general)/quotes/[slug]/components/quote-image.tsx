"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { quoteImageService } from "@/lib/services/quote-image/quote-image.service";
import type { Quote, AuthorProfile } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ShareActions } from "./share-actions";

interface QuoteImageProps {
  quote: Quote & {
    authorProfile: AuthorProfile;
  };
  className?: string;
}

export function QuoteImage({ quote, className }: QuoteImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  const generateQuoteImage = useCallback(async () => {
    try {
      setIsGenerating(true);
      const imageData = await quoteImageService.createImage(quote, {
        width: 1080,
        height: 1080,
        padding: 40,
        backgroundColor: '#ffffff',
        textColor: quote.backgroundImage ? '#ffffff' : '#000000',
        fontFamily: 'Inter',
        branding: {
          text: 'Quoticon',
          color: quote.backgroundImage ? '#ffffff' : '#666666',
          fontSize: 24
        }
      });
      setImageUrl(imageData);
    } catch (error) {
      console.error('Failed to generate quote image:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [quote]);

  useEffect(() => {
    generateQuoteImage();
  }, [generateQuoteImage]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quote Image Display */}
      <div className="relative rounded-lg overflow-hidden shadow-lg bg-muted">
        {isGenerating ? (
          <div className="aspect-square animate-pulse bg-muted flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : imageUrl ? (
          <div className="relative aspect-square">
            <Image
              ref={imageRef}
              src={imageUrl}
              alt={`Quote by ${quote.authorProfile.name}`}
              fill
              className="object-contain"
              unoptimized // Since we're using base64 data URL
              priority // Load immediately as it's the main content
            />
          </div>
        ) : (
          <div className="aspect-square bg-muted flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Failed to generate image</p>
          </div>
        )}
      </div>

      {/* Share Actions */}
      <ShareActions
        quote={quote}
        imageUrl={imageUrl}
        disabled={isGenerating}
      />
    </div>
  );
}