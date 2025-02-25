// app/(general)/quotes/[slug]/components/quote-background.tsx
"use client"

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";

interface QuoteBackgroundProps {
  background: Gallery | null;
  overlayStyle?: "light" | "dark" | "transparent" | "gradient";
  className?: string;
  imageClassName?: string;
}

export function QuoteBackground({
  background,
  overlayStyle = "dark",
  className,
  imageClassName,
}: QuoteBackgroundProps) {
  // If no background is provided, display a gradient background
  if (!background) {
    return (
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5",
        className
      )} />
    );
  }

  return (
    <div className={cn("absolute inset-0", className)}>
      <Image 
        src={background.url}
        alt={background.title || "Quote background"}
        fill
        className={cn("object-cover", imageClassName)}
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1080px"
      />
      
      {/* Overlay styles for better readability of text */}
      {overlayStyle === "dark" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
      )}
      
      {overlayStyle === "light" && (
        <div className="absolute inset-0 bg-white/60" />
      )}
      
      {overlayStyle === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-secondary/50 mix-blend-overlay" />
      )}
    </div>
  );
}

/**
 * Component for selecting from available backgrounds
 */
interface BackgroundSelectorProps {
  backgrounds: Gallery[];
  activeBackground: Gallery | null;
  onSelectBackground: (background: Gallery) => void;
  className?: string;
}

export function BackgroundSelector({
  backgrounds,
  activeBackground,
  onSelectBackground,
  className
}: BackgroundSelectorProps) {
  if (backgrounds.length === 0) {
    return null;
  }
  
  return (
    <div className={cn("flex flex-wrap gap-2 mt-4", className)}>
      {backgrounds.map((background) => (
        <button
          key={background.id}
          onClick={() => onSelectBackground(background)}
          className={cn(
            "w-16 h-16 rounded-md overflow-hidden relative border-2",
            activeBackground?.id === background.id 
              ? "border-primary ring-2 ring-primary/30" 
              : "border-transparent hover:border-primary/50"
          )}
          aria-label={`Select ${background.title || 'background'}`}
        >
          <Image
            src={background.url}
            alt={background.title || "Background option"}
            fill
            className="object-cover"
            sizes="64px"
          />
        </button>
      ))}
      
      {/* Default solid background option */}
      <button
        onClick={() => onSelectBackground({ id: "default", url: "", title: "Default", type: "SOLID" } as Gallery)}
        className={cn(
          "w-16 h-16 rounded-md overflow-hidden relative border-2 bg-gradient-to-br from-primary/10 to-primary/5",
          !activeBackground || activeBackground.id === "default"
            ? "border-primary ring-2 ring-primary/30" 
            : "border-transparent hover:border-primary/50"
        )}
        aria-label="Default background"
      >
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground/70">
          Default
        </span>
      </button>
    </div>
  );
}

/**
 * Preset background styles for the quote display
 */
export const backgroundStyles = {
  dark: {
    overlayStyle: "dark" as const,
    textColor: "text-white",
    shadowColor: "rgba(0,0,0,0.3)"
  },
  light: {
    overlayStyle: "light" as const,
    textColor: "text-gray-900",
    shadowColor: "rgba(0,0,0,0.1)"
  },
  gradient: {
    overlayStyle: "gradient" as const,
    textColor: "text-white",
    shadowColor: "rgba(0,0,0,0.25)"
  },
  transparent: {
    overlayStyle: "transparent" as const,
    textColor: "text-white",
    shadowColor: "rgba(0,0,0,0.2)"
  }
};