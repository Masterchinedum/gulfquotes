"use client"

import React from "react";
import { cn } from "@/lib/utils";

interface QuoteLayoutProps {
  children: React.ReactNode;
  className?: string;
  innerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * QuoteLayout - A standardized layout component for displaying quotes
 * with consistent dimensions and padding
 */
export function QuoteLayout({
  children,
  className,
  innerRef,
}: QuoteLayoutProps) {
  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden",
        "aspect-square",
        className
      )}
    >
      {/* This is the fixed-size container with a 1:1 aspect ratio */}
      <div 
        ref={innerRef}
        className="w-full h-full relative"
        style={{
          width: "1080px",
          height: "1080px",
          maxWidth: "100%",
          aspectRatio: "1/1",
        }}
      >
        {/* Content container with standard 40px padding */}
        <div 
          className="absolute inset-0 flex flex-col"
          style={{ padding: "40px" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * QuoteContentArea - A flexible container for the quote content
 * that centers its contents both horizontally and vertically
 */
export function QuoteContentArea({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      "w-full h-full",
      "relative",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * ResponsiveQuoteContainer - A container that ensures quotes
 * are displayed responsively across different screen sizes
 */
export function ResponsiveQuoteContainer({ 
  children,
  className,
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full mx-auto", className)}>
      <div 
        className="w-full relative"
        style={{ 
          maxWidth: "1080px", 
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}