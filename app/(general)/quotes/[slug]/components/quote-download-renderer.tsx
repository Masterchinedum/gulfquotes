// app/(general)/quotes/[slug]/components/quote-download-renderer.tsx
"use client"

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Gallery } from "@prisma/client";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteDownloadRendererProps {
  quote: QuoteDisplayData;
  background: Gallery | null;
  fontSize: number;
  className?: string;
}

const CANVAS_SIZE = 1080;
const PADDING = 40;

export function QuoteDownloadRenderer({
  quote,
  background,
  fontSize,
  className
}: QuoteDownloadRendererProps) {
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [isImageLoaded, setImageLoaded] = useState(!background);
  const [isRendererReady, setRendererReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Font preloading
  useEffect(() => {
    Promise.all([
      document.fonts.load(`${fontSize}px "Inter"`),
      document.fonts.load(`${fontSize}px "serif"`),
    ]).then(() => {
      setIsFontLoaded(true);
    });
  }, [fontSize]);

  // Background image preloading
  useEffect(() => {
    if (!background?.url) {
      setImageLoaded(true);
      return;
    }

    // Create image element with proper typing
    const img = document.createElement('img');
    img.width = CANVAS_SIZE;
    img.height = CANVAS_SIZE;
    img.onload = () => setImageLoaded(true);
    img.src = background.url;

    return () => {
      img.onload = null;
    };
  }, [background?.url]);

  // Set renderer ready when all assets are loaded
  useEffect(() => {
    if (isFontLoaded && isImageLoaded) {
      setRendererReady(true);
    }
  }, [isFontLoaded, isImageLoaded]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed left-[-9999px]", // Hide off-screen
        "overflow-hidden",
        className
      )}
      style={{
        width: `${CANVAS_SIZE}px`,
        height: `${CANVAS_SIZE}px`,
        opacity: isRendererReady ? 1 : 0, // Hide until ready
      }}
    >
      {/* Background Layer */}
      <div className="absolute inset-0">
        {background?.url ? (
          <Image
            src={background.url}
            alt="Quote background"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="object-cover"
            priority
            quality={100}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/5" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
      </div>

      {/* Content Layer */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ padding: `${PADDING}px` }}
      >
        {/* Quote Text */}
        <div className="w-full max-w-[1000px] space-y-6 text-center">
          <p 
            className="font-serif relative"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.4,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              color: 'white'
            }}
          >
            {/* Quote marks */}
            <span className="absolute -top-8 -left-4 text-6xl opacity-20">
              &ldquo;
            </span>
            {quote.content}
            <span className="absolute -bottom-8 -right-4 text-6xl opacity-20">
              &rdquo;
            </span>
          </p>

          {/* Author Attribution */}
          <p 
            className="text-2xl font-medium"
            style={{
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            — {quote.authorProfile?.name || "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}