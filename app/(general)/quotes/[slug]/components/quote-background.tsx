// app/(general)/quotes/[slug]/components/quote-background.tsx
"use client"

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";

// Helper function to create a properly typed default background
function createDefaultBackground(): Gallery {
  return {
    id: "default",
    url: "",
    publicId: "default",
    title: "Default",
    description: null,
    altText: null,
    format: null,
    width: null, 
    height: null,
    bytes: null,
    type: "SOLID",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    isPublic: true,
    // Add the missing properties from the error message
    isGlobal: false,
    usageCount: 0
  } as Gallery;
}

interface QuoteBackgroundProps {
  // Update this to handle string or Gallery
  background: Gallery | string | null;
  overlayStyle: string;
  className?: string;
  imageClassName?: string;
}

export function QuoteBackground({
  background,
  overlayStyle,
}: QuoteBackgroundProps) {
  const backgroundUrl = typeof background === 'string' 
    ? background 
    : background?.url || null;

  return (
    <div 
      className={cn(
        "absolute inset-0 rounded-lg overflow-hidden", 
        overlayStyle,
        backgroundUrl ? "bg-image" : ""
      )}
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {}}
    />
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
        onClick={() => onSelectBackground(createDefaultBackground())}
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