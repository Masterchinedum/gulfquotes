// app/(general)/quotes/[slug]/components/quote-display.tsx
"use client"
import React, { useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { Gallery } from "@prisma/client";
import { QuoteBackground, backgroundStyles } from "./quote-background";

interface QuoteDisplayProps {
  quote: QuoteDisplayData;
  fontSize?: number;
  backgroundImage: Gallery | null;
  backgroundStyle?: keyof typeof backgroundStyles;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function QuoteDisplay({
  quote,
  fontSize: propFontSize,
  backgroundImage,
  backgroundStyle = "dark",
  className,
  containerRef,
}: QuoteDisplayProps) {
  // Create a local ref if no external ref is provided
  const localRef = useRef<HTMLDivElement>(null);
  const ref = containerRef || localRef;
  
  // Calculate a default font size based on quote length if none is provided
  const fontSize = useMemo(() => {
    if (propFontSize) return propFontSize;
    
    const length = quote.content.length;
    
    // Using the precise template specification you provided
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
    return 28; // For anything longer than 700 characters
  }, [quote.content.length, propFontSize]);
  
  // Get the style settings based on the selected background style
  const style = backgroundStyles[backgroundStyle];
  
  return (
    <div 
      className={cn(
        "w-full max-w-3xl mx-auto aspect-square",
        "relative overflow-hidden rounded-lg shadow-xl",
        "select-none",
        className
      )}
    >
      <div 
        ref={ref}
        className="w-full h-full relative"
        style={{
          aspectRatio: "1/1",
          width: "1080px", // Setting fixed width as requested
          height: "1080px", // Setting fixed height as requested
          maxWidth: "100%", // Allows it to scale down on smaller screens
        }}
      >
        {/* Background Layer */}
        <QuoteBackground 
          background={backgroundImage}
          overlayStyle={style.overlayStyle}
        />

        {/* Quote Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10" style={{ padding: "40px" }}>
          <div className="relative w-full max-w-full">
            {/* Quote Marks */}
            <div className={cn(
              "absolute -top-8 -left-4 text-6xl opacity-20", 
              style.textColor
            )}>
              &ldquo;
            </div>

            {/* Quote Text */}
            <p 
              className={cn(
                "text-center font-serif relative z-10",
                "leading-snug tracking-wide",
                style.textColor
              )}
              style={{
                fontSize: `${fontSize}px`,
                textShadow: `0 2px 4px ${style.shadowColor}`
              }}
            >
              {quote.content}
            </p>

            {/* Quote Marks Closing */}
            <div className={cn(
              "absolute -bottom-12 -right-4 text-6xl opacity-20", 
              style.textColor
            )}>
              &rdquo;
            </div>
          </div>

          {/* Author Attribution */}
          <div className="mt-auto">
            <p 
              className={cn(
                "text-center font-medium mt-8",
                "text-xl sm:text-2xl",
                style.textColor
              )}
              style={{
                textShadow: `0 1px 3px ${style.shadowColor}`
              }}
            >
              — {quote.authorProfile?.name || "Unknown"}
            </p>
          </div>
        </div>

        {/* Subtle Border Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-lg" />

        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-5 bg-[url('/textures/noise.png')] mix-blend-overlay pointer-events-none" />

        {/* Category Tag */}
        {quote.category && (
          <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white/80">
            {quote.category.name}
          </div>
        )}
      </div>
    </div>
  );
}

// Export a fully responsive container for the quote display
export function ResponsiveQuoteContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="w-full relative" style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}