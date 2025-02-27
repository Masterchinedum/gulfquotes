// app/(general)/quotes/[slug]/components/quote-content.tsx
"use client"

import React from "react";
import { cn } from "@/lib/utils";

interface QuoteContentProps {
  content: string;
  author: string | null;
  fontSize: number;
  textColor: string;
  shadowColor: string;
  siteName?: string; // Add site name prop with default value
  className?: string;
}

const PADDING_RATIO = 40 / 1080; // 40px padding for 1080px canvas

export function QuoteContent({
  content,
  author,
  fontSize,
  textColor,
  shadowColor,
  siteName = "Quoticon", // Default to "Quoticon" if not provided
  className
}: QuoteContentProps) {
  // Calculate padding based on container size
  const scaledPadding = `${PADDING_RATIO * 100}%`;

  return (
    <div 
      className={cn(
        "absolute inset-0", // Fixed positioning
        "flex flex-col items-center justify-center", // Flexbox centering
        className
      )}
      style={{ padding: scaledPadding }}
    >
      {/* Content Container */}
      <div className="relative w-full max-w-[92.5925925926%]"> {/* 1000px / 1080px */}
        {/* Quote Text with Quotation Marks */}
        <div className="relative">
          {/* Opening Quote Mark - positioned relative to quote text only */}
          <div className={cn(
            "absolute -top-8 -left-4 text-6xl opacity-20",
            textColor
          )}>
            &ldquo;
          </div>

          {/* Main Quote Text */}
          <p className={cn(
            "text-center font-serif relative z-10",
            "leading-snug tracking-wide mb-4", // Add bottom margin for separation
            textColor
          )}
          style={{
            fontSize: `${fontSize}px`,
            textShadow: `0 2px 4px ${shadowColor}`
          }}>
            {content}

            {/* Closing Quote Mark - positioned relative to quote text only */}
            <span className={cn(
              "absolute -bottom-4 -right-4 text-6xl opacity-20 leading-none",
              textColor
            )}>
              &rdquo;
            </span>
          </p>
        </div>

        {/* Attribution Footer - separated from the quote */}
        <div className="mt-12 space-y-1 text-center">
          {/* Author Attribution */}
          <p className={cn(
            "font-medium",
            "text-xl sm:text-2xl",
            textColor
          )}
          style={{
            textShadow: `0 1px 3px ${shadowColor}`
          }}>
            — {author || "Unknown"}
          </p>
          
          {/* Site Name */}
          <p className={cn(
            "text-sm sm:text-base opacity-80",
            textColor
          )}
          style={{
            textShadow: `0 1px 2px ${shadowColor}`
          }}>
            {siteName}.com
          </p>
        </div>
      </div>
    </div>
  );
}