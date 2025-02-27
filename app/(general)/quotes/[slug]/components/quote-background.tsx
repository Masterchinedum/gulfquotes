"use client"

import React, { useCallback, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";

interface QuoteBackgroundProps {
  background: Gallery | string | null;
  overlayStyle?: keyof typeof overlayStyles;
  className?: string;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

// Overlay style configurations
const overlayStyles = {
  dark: "bg-gradient-to-t from-black/70 via-black/40 to-black/30",
  light: "bg-white/60",
  gradient: "bg-gradient-to-br from-primary/50 to-secondary/50 mix-blend-overlay",
  transparent: "",
} as const;

// Image cache for preloaded images
const preloadedImages = new Map<string, boolean>();

/**
 * Preloads an image and stores it in the browser cache
 */
function preloadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (preloadedImages.has(src)) {
      resolve(true);
      return;
    }
    
    // Use window.Image to be explicit about using the browser's built-in Image constructor
    const img = new window.Image();
    img.onload = () => {
      preloadedImages.set(src, true);
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = src;
  });
}

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
  onLoadStart,
  onLoadComplete
}: QuoteBackgroundProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);
  const backgroundUrl = typeof background === 'string' 
    ? background 
    : background?.url || null;
  
  const previousBackground = useRef<string | null>(null);
  
  // Preload the image when the background changes
  useEffect(() => {
    if (!backgroundUrl) return;
    
    // If we already preloaded this image, don't do it again
    if (preloadedImages.has(backgroundUrl)) {
      setIsPreloaded(true);
      return;
    }
    
    const preload = async () => {
      const success = await preloadImage(backgroundUrl);
      if (success) {
        setIsPreloaded(true);
      }
    };
    
    preload();
  }, [backgroundUrl]);
  
  // Handle background transition when url changes
  useEffect(() => {
    if (backgroundUrl !== previousBackground.current) {
      // Save previous URL for crossfade effect
      if (previousBackground.current) {
        setPreviousUrl(previousBackground.current);
      }
      
      // Update the current background reference
      previousBackground.current = backgroundUrl;
      
      // Trigger loading state if not preloaded
      if (backgroundUrl && !preloadedImages.has(backgroundUrl)) {
        setIsLoading(true);
        onLoadStart?.();
      }
    }
  }, [backgroundUrl, onLoadStart]);

  // Handle image loading start
  const handleLoadStart = useCallback(() => {
    if (!isPreloaded) {
      setIsLoading(true);
      onLoadStart?.();
    }
  }, [isPreloaded, onLoadStart]);

  // Handle image load complete
  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
    onLoadComplete?.();
    
    // Clear previous URL after transition completes
    setTimeout(() => {
      setPreviousUrl(null);
    }, 500); // Match the duration in the CSS transition
  }, [onLoadComplete]);

  // Handle image load error with retry
  const handleLoadError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Background image load error:", e);
    
    // Remove from preloaded cache so we can try again
    if (backgroundUrl) {
      preloadedImages.delete(backgroundUrl);
    }
    
    setIsLoading(false);
    setIsPreloaded(false);
    onLoadComplete?.(); // Complete loading even on error
  }, [backgroundUrl, onLoadComplete]);

  return (
    <div className={cn(
      "relative w-full h-full transition-all duration-500 ease-out",
      isLoading && "scale-105 blur-sm",
      className
    )}>
      <div className="absolute inset-0 overflow-hidden">
        {/* Previous background for crossfade effect */}
        {previousUrl && (
          <div className="absolute inset-0 z-10 transition-opacity duration-500 opacity-0">
            <Image
              src={previousUrl}
              alt="Previous background"
              fill
              className="object-cover w-full h-full select-none pointer-events-none"
              sizes="1080px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority={false}
              unoptimized
            />
          </div>
        )}
        
        {backgroundUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={backgroundUrl}
              alt="Quote background"
              fill
              className={cn(
                "object-cover w-full h-full",
                "select-none pointer-events-none quote-background-image",
                "transition-all duration-500 ease-out",
                isLoading && "scale-110 blur-sm",
                isPreloaded ? "opacity-100" : "opacity-0"
              )}
              sizes="1080px"
              style={{ 
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              priority
              unoptimized
              onLoadStart={handleLoadStart}
              onLoad={handleLoadComplete}
              onError={handleLoadError}
            />
          </div>
        ) : (
          <div className={cn(
            "absolute inset-0",
            "bg-gradient-to-br from-primary/10 to-secondary/5",
            "transition-opacity duration-500"
          )} />
        )}
      </div>

      {/* Enhanced Overlay Layer */}
      <div className={cn(
        "absolute inset-0",
        overlayStyles[overlayStyle],
        "transition-all duration-500",
        "backdrop-filter backdrop-grayscale",
        isLoading ? "opacity-0" : "opacity-5",
        "mix-blend-overlay"
      )} />

      {/* Border Overlay with transition */}
      <div className={cn(
        "absolute inset-0",
        "border border-white/10 rounded-lg",
        "pointer-events-none",
        "transition-opacity duration-500",
        isLoading && "opacity-0"
      )} />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
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