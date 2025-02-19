"use client";

import { CldImage } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";

interface GalleryCardProps {
  item: GalleryItem;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GalleryCard({
  item,
  isSelected = false,
  onSelect,
  onDelete,
  disabled = false,
  loading = false
}: GalleryCardProps) {
  return (
    <div
      className={cn(
        "group relative aspect-[1.91/1] overflow-hidden rounded-lg border",
        "transition-all hover:opacity-90",
        isSelected && "ring-2 ring-primary",
        disabled && "opacity-50 cursor-not-allowed",
        loading && "animate-pulse"
      )}
    >
      {/* Image */}
      <CldImage
        src={item.publicId}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        alt={item.altText || "Gallery image"}
        className="object-cover"
      />
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <Check className="h-6 w-6 text-primary" />
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Hover Actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
        {onSelect && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSelect}
            disabled={disabled || loading}
          >
            Select
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={disabled || loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Metadata Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs truncate">{item.title || "Untitled"}</p>
        <p className="text-xs text-gray-300">Used: {item._count?.quotes || 0} times</p>
      </div>
    </div>
  );
}