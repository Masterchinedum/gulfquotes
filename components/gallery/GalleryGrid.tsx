"use client";

import { useState, useEffect, useCallback } from "react";
import { CldImage } from "next-cloudinary";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";

interface GalleryGridProps {
  searchQuery?: string;
  maxSelectable?: number;
  currentlySelected?: string[];
  onSelect: (images: GalleryItem[]) => void;
}

export function GalleryGrid({
  searchQuery = "",
  maxSelectable = 1,
  currentlySelected = [],
  onSelect
}: GalleryGridProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentlySelected));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch gallery items
  const fetchItems = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: reset ? "1" : page.toString(),
        limit: "20",
        ...(searchQuery ? { search: searchQuery } : {})
      });

      const response = await fetch(`/api/gallery?${searchParams}`);
      if (!response.ok) throw new Error("Failed to fetch images");

      const data = await response.json();
      
      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setHasMore(data.hasMore);
      if (reset) setPage(1);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  // Initial fetch and search handling
  useEffect(() => {
    fetchItems(true);
  }, [searchQuery, fetchItems]);

  // Handle image selection
  const handleImageSelect = (item: GalleryItem) => {
    const newSelected = new Set(selectedIds);
    
    if (newSelected.has(item.publicId)) {
      newSelected.delete(item.publicId);
    } else {
      if (newSelected.size >= maxSelectable) {
        if (maxSelectable === 1) {
          newSelected.clear();
        } else {
          return; // Don't add if we're at the limit
        }
      }
      newSelected.add(item.publicId);
    }
    
    setSelectedIds(newSelected);
  };

  // Handle confirm selection
  const handleConfirm = () => {
    const selectedImages = items.filter(item => 
      selectedIds.has(item.publicId)
    );
    onSelect(selectedImages);
  };

  return (
    <div className="space-y-4">
      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.publicId}
            className={cn(
              "group relative aspect-[1.91/1] overflow-hidden rounded-lg border",
              "cursor-pointer transition-all hover:opacity-90",
              selectedIds.has(item.publicId) && "ring-2 ring-primary"
            )}
            onClick={() => handleImageSelect(item)}
          >
            <CldImage
              src={item.publicId}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              alt={item.altText || "Gallery image"}
              className="object-cover"
            />
            
            {selectedIds.has(item.publicId) && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary" />
              </div>
            )}

            {/* Image info overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs truncate">{item.title || "Untitled"}</p>
              <p className="text-xs text-gray-300">Used: {item._count?.quotes || 0} times</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center text-destructive p-4">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">
            No images found. Upload some images to get started.
          </p>
        </div>
      )}

      {/* Load more button */}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setPage(prev => prev + 1);
              fetchItems();
            }}
          >
            Load More
          </Button>
        </div>
      )}

      {/* Selection actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          onClick={handleConfirm}
          disabled={selectedIds.size === 0}
        >
          {selectedIds.size === 0 
            ? "Select Images" 
            : `Use ${selectedIds.size} Selected`}
        </Button>
      </div>
    </div>
  );
}