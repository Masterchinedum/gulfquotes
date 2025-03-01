"use client"

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Check, ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Gallery } from "@prisma/client";
// import { useBackgroundPreloader } from "@/hooks/use-background-preloader";

interface QuoteBackgroundSwitcherProps {
  backgrounds: Array<Gallery & {
    isActive?: boolean;
    isBackground?: boolean;
  }>;
  activeBackground: Gallery | null;
  onBackgroundChange: (background: Gallery) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function QuoteBackgroundSwitcher({
  backgrounds,
  activeBackground,
  onBackgroundChange,
  isLoading = false,
  className
}: QuoteBackgroundSwitcherProps) {
  // Create a default background option
  const defaultBackground: Gallery = {
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

  // Comment out or temporarily disable this hook
  // useBackgroundPreloader({
  //   initialImages: backgrounds,
  //   priorityImages: activeBackground ? 
  //     [activeBackground, ...backgrounds.slice(0, 3)] : 
  //     backgrounds.slice(0, 4)
  // });

  // Simplify the handleBackgroundChange function by breaking the dependency cycle
  const handleBackgroundChange = useCallback(async (background: Gallery) => {
    try {
      // Just call the parent handler directly
      await onBackgroundChange(background);
    } catch (error) {
      console.error("Error changing background:", error);
    }
  }, [onBackgroundChange]); // Removed activeBackground dependency since it's not used in the function

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Background</h3>
          <p className="text-sm text-muted-foreground">
            Choose a background for your quote
          </p>
        </div>
      </div>

      {/* Enhanced Background Grid */}
      <ScrollArea className="h-[280px] rounded-md border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
          {/* Default Background Option */}
          <button
            onClick={() => handleBackgroundChange(defaultBackground)}
            disabled={isLoading}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg",
              "bg-gradient-to-br from-primary/10 to-primary/5",
              "border-2 transition-all duration-300 ease-in-out",
              (!activeBackground || activeBackground.id === "default")
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-primary/50",
              "hover:shadow-lg hover:scale-[1.02]",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-foreground/70">Default</span>
            </div>
            {(!activeBackground || activeBackground.id === "default") && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                <Check className="h-6 w-6 text-primary" />
              </div>
            )}
          </button>

          {/* Enhanced Background Options */}
          {backgrounds.map((background) => {
            const isSelected = activeBackground?.id === background.id;
            
            return (
              <button
                key={background.id}
                onClick={() => handleBackgroundChange(background)}
                disabled={isLoading}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                  isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/50",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {background.url && (
                  <Image 
                    src={background.url} 
                    alt={background.title || "Background option"} 
                    fill
                    className="object-cover w-full h-full"
                  />
                )}
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-primary/20 rounded-full p-1">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Global Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm
                      flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Empty State */}
      {backgrounds.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No backgrounds available
          </p>
          <p className="text-xs text-muted-foreground">
            Add some backgrounds to get started
          </p>
        </div>
      )}
    </div>
  );
}