"use client"
import React, { useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { Gallery } from "@prisma/client";
import { QuoteBackground, backgroundStyles } from "./quote-background";
import { QuoteLayout } from "./quote-layout";

interface QuoteDisplayProps {
  quote: QuoteDisplayData;
  fontSize?: number;
  // Update this type to accept string or Gallery
  backgroundImage?: Gallery | string | null;
  backgroundStyle?: keyof typeof backgroundStyles;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function QuoteDisplay({
  quote,
  fontSize: propFontSize,
  backgroundStyle = "dark",
  className,
  containerRef,
  backgroundImage,
}: QuoteDisplayProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = (containerRef || localRef) as React.RefObject<HTMLDivElement>;
  
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
    if (length <= 700) return 30;
    return 28;
  }, [quote.content.length, propFontSize]);
  
  const style = backgroundStyles[backgroundStyle];
  
  return (
    <QuoteLayout
      innerRef={ref}
      className={cn(
        "rounded-lg shadow-xl",
        "select-none",
        className
      )}
    >
      {/* Add the background if needed */}
      <QuoteBackground 
        background={backgroundImage || null} 
        overlayStyle={style.overlayStyle} 
      />
      
      <p className={cn(
        "text-center font-serif relative z-10",
        "leading-snug tracking-wide",
        style.textColor,
        `text-[${fontSize}px]`
      )}>
        {quote.content}
      </p>
    </QuoteLayout>
  );
}

export { ResponsiveQuoteContainer } from "./quote-layout";