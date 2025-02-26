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
  className?: string;
}

const PADDING_RATIO = 40 / 1080; // 40px padding for 1080px canvas

export function QuoteContent({
  content,
  author,
  fontSize,
  textColor,
  shadowColor,
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
        {/* Quote Text */}
        <div className="space-y-4">
          {/* Opening Quote Mark */}
          <div className={cn(
            "absolute -top-8 -left-4 text-6xl opacity-20",
            textColor
          )}>
            &ldquo;
          </div>

          {/* Main Quote Text */}
          <p className={cn(
            "text-center font-serif relative z-10",
            "leading-snug tracking-wide",
            textColor
          )}
          style={{
            fontSize: `${fontSize}px`,
            textShadow: `0 2px 4px ${shadowColor}`
          }}>
            {content}
          </p>

          {/* Closing Quote Mark */}
          <div className={cn(
            "absolute -bottom-12 -right-4 text-6xl opacity-20",
            textColor
          )}>
            &rdquo;
          </div>
        </div>

        {/* Author Attribution */}
        <div className="mt-8">
          <p className={cn(
            "text-center font-medium",
            "text-xl sm:text-2xl",
            textColor
          )}
          style={{
            textShadow: `0 1px 3px ${shadowColor}`
          }}>
            — {author || "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}