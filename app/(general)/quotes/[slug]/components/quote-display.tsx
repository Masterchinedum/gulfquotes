"use client"

import React, { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { Gallery } from "@prisma/client";
import { QuoteBackground, backgroundStyles } from "./quote-background";
import { QuoteLayout } from "./quote-layout";
import { QuoteContent } from "./quote-content";
import { quoteDownloadService } from "@/lib/services/quote-download.service";

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
    // Wait a moment to ensure background is fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    const dataUrl = await quoteDownloadService.generateImage(clone);
    return dataUrl;
  } finally {
    document.body.removeChild(clone);
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

// Track current background for download
  const [currentBackground, setCurrentBackground] = useState<Gallery | string | null>(backgroundImage);
  
  // Update current background when prop changes
  useEffect(() => {
    setCurrentBackground(backgroundImage);
  }, [backgroundImage]);
  
  // Track current background for download
  const [currentBackground, setCurrentBackground] = useState<Gallery | string | null>(backgroundImage);
  
  // Update current background when prop changes
  useEffect(() => {
    setCurrentBackground(backgroundImage);
  }, [backgroundImage]);
  
  // Track current background for download
  const [currentBackground, setCurrentBackground] = useState<Gallery | string | null>(backgroundImage);
  
  // Update current background when prop changes
  useEffect(() => {
    setCurrentBackground(backgroundImage);
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
        background={currentBackground || null}  // Use currentBackground instead of backgroundImage
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