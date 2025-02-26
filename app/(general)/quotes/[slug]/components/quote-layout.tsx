"use client"

import React from "react";
import { cn } from "@/lib/utils";
import { useViewportScale } from "@/hooks/use-viewport-scale";

const CANVAS_SIZE = 1080; // Fixed size for width and height
const PADDING = 40; // Fixed padding that will scale proportionally

interface QuoteLayoutProps {
  children: React.ReactNode;
  className?: string;
  innerRef?: React.RefObject<HTMLDivElement>;
}

export function QuoteLayout({
  children,
  className,
  innerRef,
}: QuoteLayoutProps) {
  // Explicitly type the ref as MutableRefObject<HTMLDivElement>
  const containerRef = React.useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;
  
  const { scale, containerWidth, contentScale } = useViewportScale(
    containerRef as React.RefObject<HTMLElement>,
    {
      targetWidth: CANVAS_SIZE,
      targetHeight: CANVAS_SIZE,
      minScale: 0.1,
      maxScale: 1,
      padding: PADDING
    }
  );

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative mx-auto",
        className
      )}
      style={{
        width: `${containerWidth}px`,
        height: `${containerWidth}px`, // Keep aspect ratio 1:1
      }}
    >
      {/* Fixed size canvas container */}
      <div 
        ref={innerRef}
        className="absolute top-1/2 left-1/2 origin-center"
        style={{ 
          width: `${CANVAS_SIZE}px`,
          height: `${CANVAS_SIZE}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* Content wrapper with scaled padding */}
        <div 
          className="absolute inset-0 bg-white overflow-hidden"
          style={{ 
            padding: `${PADDING * contentScale}px`,
          }}
        >
          {/* Content container */}
          <div className="relative w-full h-full flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ResponsiveQuoteContainer - Wrapper to handle responsive scaling
 */
export function ResponsiveQuoteContainer({ 
  children,
  className,
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "w-full max-w-[1080px] mx-auto overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
}