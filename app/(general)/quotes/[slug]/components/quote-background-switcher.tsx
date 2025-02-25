// app/(general)/quotes/[slug]/components/quote-background-switcher.tsx
"use client"

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Check, ImageIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Gallery } from "@prisma/client";

interface QuoteBackgroundSwitcherProps {
  backgrounds: Gallery[];
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

      {/* Background Grid */}
      <ScrollArea className="h-[280px] rounded-md border">
        <div className="grid grid-cols-3 gap-4 p-4">
          {/* Default Background Option */}
          <button
            onClick={() => onBackgroundChange(defaultBackground)}
            disabled={isLoading}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg",
              "bg-gradient-to-br from-primary/10 to-primary/5",
              "border-2 transition-all",
              (!activeBackground || activeBackground.id === "default")
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-primary/50",
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

          {/* Available Backgrounds */}
          {backgrounds.map((background) => (
            <button
              key={background.id}
              onClick={() => onBackgroundChange(background)}
              disabled={isLoading}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg",
                "border-2 transition-all",
                activeBackground?.id === background.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-primary/50",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Background Preview */}
              <Image
                src={background.url}
                alt={background.title || "Background option"}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="(max-width: 768px) 33vw, 200px"
              />

              {/* Selection Overlay */}
              {activeBackground?.id === background.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                  <Check className="h-6 w-6 text-primary" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-black/50 opacity-0 transition-opacity",
                "group-hover:opacity-100"
              )}>
                <p className="text-xs font-medium text-white">
                  Select Background
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

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