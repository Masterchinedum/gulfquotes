"use client"

import React, { useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { Gallery } from "@prisma/client";
import { QuoteBackground, backgroundStyles } from "./quote-background";
import { QuoteLayout } from "./quote-layout";
import { QuoteContent } from "./quote-content";
import { quoteDownloadService, QUALITY_PRESETS } from "@/lib/services/quote-download.service";

interface QuoteDisplayProps {
  quote: QuoteDisplayData;
  fontSize?: number;
  backgroundImage?: Gallery | string | null;
  backgroundStyle?: keyof typeof backgroundStyles;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  onPrepareDownload?: () => void;
  onDownloadComplete?: () => void;
}

export async function prepareForDownload(
  element: HTMLElement,
  quality: keyof typeof QUALITY_PRESETS = 'standard'
): Promise<string> {
  // Clone the element for download
  const clone = element.cloneNode(true) as HTMLElement;
  document.body.appendChild(clone);
  
  try {
    const dataUrl = await quoteDownloadService.generateImage(clone, {
      ...QUALITY_PRESETS[quality]
    });
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
  // Cast the ref to MutableRefObject to match QuoteLayout's expectations
  const ref = (containerRef || localRef) as React.MutableRefObject<HTMLDivElement>;
  
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

  // Handle download preparation with proper dependencies
  const handlePrepareDownload = useCallback(() => {
    if (ref.current) {
      onPrepareDownload?.();
    }
  }, [onPrepareDownload, ref]);

  // Handle download completion with proper dependencies  
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
        className
      )}
      onPrepareDownload={handlePrepareDownload}
      onDownloadComplete={handleDownloadComplete}
    >
      <QuoteBackground 
        background={backgroundImage || null} 
        overlayStyle={style.overlayStyle} 
      />
      
      <QuoteContent 
        content={quote.content}
        author={quote.authorProfile?.name}
        fontSize={fontSize}
        textColor={style.textColor}
        shadowColor={style.shadowColor}
        className="z-10"
      />
    </QuoteLayout>
  );
}

export { ResponsiveQuoteContainer } from "./quote-layout";