"use client";

import { CldImage } from "next-cloudinary";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/types/gallery";
// import type { QuoteImageResource } from "@/types/cloudinary";

interface QuoteImageGalleryProps {
  items: GalleryItem[];
  isLoading?: boolean;
  error?: string;
  selectedImage?: string | null;
  currentlySelected?: string[];
  maxSelectable?: number;
  onSelect: (image: GalleryItem) => void;
  onDeselect?: (imageId: string) => void;
  isMultiSelect?: boolean;
  isBackground?: boolean;
  disabled?: boolean;
}

export function QuoteImageGallery({
  items,
  isLoading = false,
  error,
  selectedImage,
  currentlySelected = [],
  maxSelectable = 1,
  onSelect,
  onDeselect,
  isMultiSelect = false,
  isBackground = false,
  disabled = false
}: QuoteImageGalleryProps) {
  // Handle error state
  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        {error}
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Handle empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-sm text-muted-foreground">
          No images available. Select images from the gallery to get started.
        </p>
      </div>
    );
  }

  const isSelected = (item: GalleryItem) => {
    if (isBackground) {
      return selectedImage === item.url;
    }
    return currentlySelected.includes(item.id);
  };

  const canSelect = (item: GalleryItem) => {
    if (isBackground) {
      return true;
    }
    if (!isMultiSelect) {
      return true;
    }
    return currentlySelected.length < maxSelectable || isSelected(item);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "group relative aspect-[1.91/1] overflow-hidden rounded-lg border",
            "transition-all hover:opacity-90",
            isSelected(item) && "ring-2 ring-primary",
            disabled && "opacity-50 cursor-not-allowed",
            !canSelect(item) && "opacity-50 cursor-not-allowed"
          )}
        >
          <CldImage
            src={item.publicId}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            alt={item.altText || "Quote background"}
            className="object-cover"
          />
          
          {/* Selection Indicator */}
          {isSelected(item) && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <Check className="h-6 w-6 text-primary" />
            </div>
          )}

          {/* Actions Overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
            <Button
              type="button"
              variant={isSelected(item) ? "destructive" : "secondary"}
              size="sm"
              onClick={() => {
                if (isSelected(item) && onDeselect) {
                  onDeselect(item.id);
                } else if (canSelect(item)) {
                  onSelect(item);
                }
              }}
              disabled={disabled || (!canSelect(item) && !isSelected(item))}
            >
              {isSelected(item) ? "Remove" : "Select"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}