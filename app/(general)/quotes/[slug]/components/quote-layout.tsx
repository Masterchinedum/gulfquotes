"use client"

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface QuoteLayoutProps {
  children: React.ReactNode;
  className?: string;
  innerRef?: React.RefObject<HTMLDivElement>;
}

const CANVAS_SIZE = 1080; // Fixed size for width and height
const PADDING = 40; // Fixed padding that will scale proportionally

/**
 * QuoteLayout - A standardized layout component for displaying quotes
 * with consistent dimensions and padding
 */
export function QuoteLayout({
  children,
  className,
  innerRef,
}: QuoteLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(CANVAS_SIZE);

  // Calculate and update scale based on container width
  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      const parentWidth = containerRef.current?.parentElement?.offsetWidth || CANVAS_SIZE;
      const newScale = Math.min(1, parentWidth / CANVAS_SIZE);
      setScale(newScale);
      setContainerWidth(parentWidth);
    };

    // Initial calculation
    updateScale();

    // Add resize observer
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current.parentElement as Element);
    }

    return () => resizeObserver.disconnect();
  }, []);

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
            padding: `${PADDING}px`,
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