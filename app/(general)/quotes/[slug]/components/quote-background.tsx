"use client"

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";

interface QuoteBackgroundProps {
  background: Gallery | string | null;
  overlayStyle?: keyof typeof overlayStyles;
  className?: string;
}

// Overlay style configurations
const overlayStyles = {
  dark: "bg-gradient-to-t from-black/70 via-black/40 to-black/30",
  light: "bg-white/60",
  gradient: "bg-gradient-to-br from-primary/50 to-secondary/50 mix-blend-overlay",
  transparent: "",
} as const;

/**
 * Creates a default background gallery item
 */
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
    isGlobal: false,
    usageCount: 0
  } as Gallery;
}

export function QuoteBackground({
  background,
  overlayStyle = "dark",
  className,
}: QuoteBackgroundProps) {
  const backgroundUrl = typeof background === 'string' 
    ? background 
    : background?.url || null;

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div className="absolute inset-0 overflow-hidden">
        {backgroundUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={backgroundUrl}
              alt="Quote background"
              fill
              className={cn(
                "object-cover",
                "w-full h-full",
                "select-none pointer-events-none",
                "quote-background-image" // Specific class for download handler
              )}
              sizes="1080px"
              style={{ 
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              priority
              unoptimized // Prevent Next.js image optimization for download
            />
          </div>
        ) : (
          // Solid/Gradient Background (when no image)
          <div 
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-br from-primary/10 to-secondary/5"
            )} 
          />
        )}
      </div>

      {/* Overlay Layer */}
      <div className={cn(
        "absolute inset-0",
        overlayStyles[overlayStyle],
        "transition-opacity duration-200",
        "opacity-5 mix-blend-overlay",
        "backdrop-filter backdrop-grayscale"
      )} />

      {/* Optional Texture
      <div 
        className={cn(
          "absolute inset-0",
          "opacity-5 mix-blend-overlay pointer-events-none",
          "bg-[url('/textures/noise.png')] bg-repeat"
        )} 
      /> */}

      {/* Border Overlay */}
      <div 
        className={cn(
          "absolute inset-0",
          "border border-white/10 rounded-lg",
          "pointer-events-none"
        )} 
      />
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
 * Preset background styles with text color coordination
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
} as const;

// Types for style configurations
export type BackgroundStyle = keyof typeof backgroundStyles;