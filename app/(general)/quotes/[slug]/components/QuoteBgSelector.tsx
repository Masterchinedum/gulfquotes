// app/(general)/quotes/[slug]/components/QuoteBgSelector.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GalleryItem } from "@/types/gallery";

interface QuoteBgSelectorProps {
  currentBackground: string | null;
  galleryImages: GalleryItem[];
  onSelect: (imageUrl: string | null) => void;
  disabled?: boolean;
}

export function QuoteBgSelector({
  currentBackground,
  galleryImages,
  onSelect,
  disabled = false
}: QuoteBgSelectorProps) {
  const [selectedBg, setSelectedBg] = useState<string | null>(currentBackground);

  const handleSelectBackground = (imageUrl: string | null) => {
    setSelectedBg(imageUrl);
    onSelect(imageUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Background Style</h3>
        {selectedBg && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelectBackground(null)}
            disabled={disabled}
          >
            Reset to Default
          </Button>
        )}
      </div>

      <ScrollArea className="h-[160px] rounded-md border">
        <div className="grid grid-cols-3 gap-2 p-2">
          {/* Default gradient option */}
          <button
            onClick={() => handleSelectBackground(null)}
            className={cn(
              "relative aspect-video rounded-md overflow-hidden",
              "hover:ring-2 hover:ring-primary/50 transition-all",
              !selectedBg && "ring-2 ring-primary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              {!selectedBg && <Check className="h-4 w-4 text-primary" />}
            </div>
            <span className="absolute bottom-2 left-2 text-xs font-medium">
              Default
            </span>
          </button>

          {/* Gallery images */}
          {galleryImages.map((image) => (
            <button
              key={image.id}
              onClick={() => handleSelectBackground(image.url)}
              className={cn(
                "relative aspect-video rounded-md overflow-hidden",
                "hover:ring-2 hover:ring-primary/50 transition-all",
                selectedBg === image.url && "ring-2 ring-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <Image
                src={image.url}
                alt={image.altText || "Background option"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/30" />
              {selectedBg === image.url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}