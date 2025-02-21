"use client";

import { CldImage } from "next-cloudinary";
import { cn } from "@/lib/utils";
import { Check, Loader2, XCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/types/gallery";

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
  // Helper functions for selection logic
  const isSelected = (item: GalleryItem) => {
    if (isBackground) {
      return selectedImage === item.url;
    }
    return isMultiSelect ? currentlySelected.includes(item.id) : selectedImage === item.url;
  };

  const canSelect = (item: GalleryItem) => {
    if (disabled) return false;
    if (isBackground || !isMultiSelect) return true;
    return currentlySelected.length < maxSelectable || isSelected(item);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Quote Images</h3>
          <p className="text-sm text-muted-foreground">
            {isBackground 
              ? "Select an image to use as your quote background" 
              : "Select images to include in your quote gallery"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {currentlySelected.length} / {maxSelectable} selected
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px] border rounded-lg bg-muted/10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading images...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center min-h-[200px] border rounded-lg bg-destructive/10">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <XCircle className="h-8 w-8" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex items-center justify-center min-h-[200px] border rounded-lg bg-muted/10">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No images available</p>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group relative aspect-[1.91/1] overflow-hidden rounded-lg border transition-all",
                "hover:ring-2 hover:ring-primary/50",
                isSelected(item) && "ring-2 ring-primary",
                !canSelect(item) && "opacity-50 cursor-not-allowed",
                canSelect(item) && "cursor-pointer"
              )}
            >
              {/* Image */}
              <CldImage
                src={item.publicId}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                alt={item.altText || "Quote image"}
                className="object-cover"
              />
              
              {/* Selection Overlay */}
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
                  disabled={!canSelect(item)}
                  className="relative z-10"
                >
                  {isSelected(item) ? "Remove" : "Select"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}