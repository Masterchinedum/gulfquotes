//app/(general)/quotes/[slug]/components/quote-image.tsx

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { quoteImageService } from "@/lib/services/quote-image/quote-image.service";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import type { Quote, AuthorProfile } from "@prisma/client";
import { cn } from "@/lib/utils";

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

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `quote-${quote.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `quote-${quote.slug}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Share Quote',
          text: quote.content
        });
      } else {
        handleDownload();
      }
    } catch (error) {
      console.error('Failed to share quote:', error);
    }
  };

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

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownload}
          disabled={!imageUrl || isGenerating}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleShare}
          disabled={!imageUrl || isGenerating}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}