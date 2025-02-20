"use client";

import { Loader2 } from "lucide-react";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import type { GalleryItem } from "@/types/gallery";

interface GalleryGridProps {
  items: GalleryItem[];
  isLoading: boolean;
  onDelete?: (id: string) => Promise<void>;
  error?: string;
  searchQuery?: string;
  maxSelectable?: number;
  currentlySelected?: string[];
  onSelect?: (selectedImages: GalleryItem[]) => void;
}

export function GalleryGrid({ 
  items,
  isLoading,
  onDelete,
  error,
  // searchQuery,
  // maxSelectable,
  currentlySelected = [],
  onSelect
}: GalleryGridProps) {
  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-sm text-muted-foreground">
          No images found. Upload some images to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <GalleryCard
          key={item.id}
          item={item}
          onDelete={onDelete}
          onSelect={onSelect ? () => onSelect([item]) : undefined}
          isSelected={currentlySelected?.includes(item.publicId)}
        />
      ))}
    </div>
  );
}