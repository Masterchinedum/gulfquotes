"use client"

import React, { useRef, useMemo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { Gallery } from "@prisma/client";
import { QuoteBackground, backgroundStyles } from "./quote-background";
import { QuoteLayout } from "./quote-layout";
import { QuoteContent } from "./quote-content";
import { quoteDownloadService } from "@/lib/services/quote-download.service";

QuoteDisplay.whyDidYouRender = {
  logOnDifferentValues: true,
  customName: 'QuoteDisplay'
};

interface QuoteDisplayProps {
  quote: QuoteDisplayData;
  fontSize?: number;
  backgroundImage?: Gallery | string | null; // Can be dynamically changed by parent
  backgroundStyle?: keyof typeof backgroundStyles;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  onPrepareDownload?: () => void;
  onDownloadComplete?: () => void;
}

export async function prepareForDownload(
  element: HTMLElement
): Promise<string> {
  // Clone the element for download - this will capture the current background state
  const clone = element.cloneNode(true) as HTMLElement;
  document.body.appendChild(clone);
  
  try {
    // Mark the clone for download to apply any special download styling
    clone.classList.add('quote-downloading');
    
    // Find background image elements and ensure they're properly loaded
    const backgroundImages = clone.querySelectorAll('.quote-background-image');
    
    // Wait for all background images to load completely
    const imagePromises = Array.from(backgroundImages).map(img => {
      const imgElement = img as HTMLImageElement;
      
      // If image is already complete, no need to wait
      if (imgElement.complete && imgElement.naturalWidth > 0) {
        return Promise.resolve();
      }
      
      // Otherwise, wait for it to load or handle error
      return new Promise<void>((resolve) => {
        imgElement.onload = () => resolve();
        imgElement.onerror = () => {
          console.error('Failed to load background image for download');
          resolve(); // Continue even if image fails
        };
        
        // Set a timeout in case the image load hangs
        setTimeout(resolve, 1000);
      });
    });
    
    // Wait for background images to load
    await Promise.all(imagePromises);
    
    // Additional wait to ensure CSS transitions complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate the image with error handling
    try {
      const dataUrl = await quoteDownloadService.generateImage(clone);
      return dataUrl;
    } catch (error) {
      console.error('Error generating quote image:', error);
      throw new Error('Failed to generate image for download');
    }
  } finally {
    // Always clean up the DOM
    if (clone.parentNode) {
      document.body.removeChild(clone);
    }
  }
}

export function QuoteDisplay({
  quote,
  fontSize: propFontSize,
  backgroundStyle = "dark",
  className,
  containerRef,
  backgroundImage,
  onPrepareDownload,
  onDownloadComplete
}: QuoteDisplayProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = (containerRef || localRef) as React.MutableRefObject<HTMLDivElement>;
  
  // Track background loading state
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  
  // Memoize the background image value to prevent unnecessary re-renders
  const stableBackgroundImage = useMemo(() => {
    if (typeof backgroundImage === 'object' && backgroundImage !== null) {
      return backgroundImage;
    }
    return null;
  }, [backgroundImage]);
  
  // Handle background image load start
  const handleBackgroundLoadStart = useCallback(() => {
    setIsBackgroundLoading(true);
  }, []);

  // Handle background image load complete
  const handleBackgroundLoadComplete = useCallback(() => {
    setIsBackgroundLoading(false);
  }, []);
  
  const fontSize = useMemo(() => {
    // Font size calculation logic (unchanged)
    if (propFontSize) return propFontSize;
    
    const length = quote.content.length;
    
    if (length <= 100) return 45;
    if (length <= 240) return 41;
    if (length <= 300) return 40;
    if (length <= 350) return 39;
    if (length <= 400) return 38;
    if (length <= 450) return 36;
    if (length <= 500) return 35;
    if (length <= 550) return 33;
    if (length <= 600) return 31;
    return 28;
  }, [quote.content.length, propFontSize]);
  
  const style = backgroundStyles[backgroundStyle];

  // Handle download preparation - ensure background is loaded
  const handlePrepareDownload = useCallback(() => {
    if (ref.current && !isBackgroundLoading) {
      onPrepareDownload?.();
    } else if (isBackgroundLoading) {
      // If background is loading, wait a bit
      setTimeout(() => {
        if (ref.current) {
          onPrepareDownload?.();
        }
      }, 500);
    }
  }, [onPrepareDownload, ref, isBackgroundLoading]);

  // Handle download completion
  const handleDownloadComplete = useCallback(() => {
    if (ref.current) {
      onDownloadComplete?.();
    }
  }, [onDownloadComplete, ref]);
  
  return (
    <QuoteLayout
      innerRef={ref}
      className={cn(
        "rounded-lg shadow-xl",
        "select-none",
        "transition-all duration-500 ease-in-out",
        isBackgroundLoading && "scale-[0.99] opacity-90",
        className
      )}
      onPrepareDownload={handlePrepareDownload}
      onDownloadComplete={handleDownloadComplete}
    >
      <QuoteBackground 
        background={stableBackgroundImage}  // Use memoized background value
        overlayStyle={style.overlayStyle}
        onLoadStart={handleBackgroundLoadStart}
        onLoadComplete={handleBackgroundLoadComplete}
        className={cn(
          "transition-all duration-500 ease-in-out",
          isBackgroundLoading && "scale-105 blur-sm"
        )}
      />
      
      <QuoteContent 
        content={quote.content}
        author={quote.authorProfile?.name}
        fontSize={fontSize}
        textColor={style.textColor}
        shadowColor={style.shadowColor}
        className={cn(
          "z-10",
          "transition-all duration-500 ease-in-out",
          isBackgroundLoading && "opacity-50"
        )}
      />
    </QuoteLayout>
  );
}

export { ResponsiveQuoteContainer } from "./quote-layout";