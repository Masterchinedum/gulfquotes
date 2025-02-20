"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import type { GalleryItem } from "@/types/gallery";

interface GalleryGridProps {
  searchQuery?: string;
  onDelete?: (id: string) => Promise<void>;
}

export function GalleryGrid({ 
  searchQuery = "",
  onDelete
}: GalleryGridProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch gallery items
  const fetchItems = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: reset ? "1" : page.toString(),
        limit: "12",
        ...(searchQuery ? { search: searchQuery } : {})
      });

      const response = await fetch(`/api/gallery?${searchParams}`);
      if (!response.ok) throw new Error("Failed to fetch images");

      const { data } = await response.json();
      
      // Handle the paginated data
      const newItems = Array.isArray(data.items) ? data.items : [];
      setItems(prev => reset ? newItems : [...prev, ...newItems]);
      setHasMore(!!data.hasMore);
      if (reset) setPage(1);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setItems([]); // Reset items on error
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  // Initial fetch and search handling
  useEffect(() => {
    fetchItems(true);
  }, [searchQuery, fetchItems]);

  return (
    <div className="space-y-4">
      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.isArray(items) && items.map((item) => (
          <GalleryCard
            key={item.publicId}
            item={item}
            onDelete={onDelete}
          />
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
    </div>
  );
}