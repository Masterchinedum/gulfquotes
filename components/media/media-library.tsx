"use client";

import { useCallback, useEffect, useState } from "react";
import { CldImage } from "next-cloudinary";
import { Check, Loader2 } from "lucide-react";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { galleryUploadOptions } from "@/lib/cloudinary"; // Update to use gallery upload options
import { cn } from "@/lib/utils";
import type { 
  MediaLibraryItem, 
  CloudinaryUploadResult,
  MediaLibrarySortField,
  SortDirection
} from "@/types/cloudinary";

interface MediaLibraryProps {
  onSelect: (images: MediaLibraryItem[]) => void;
  maxSelectable?: number;
  currentlySelected?: string[];
  onClose?: () => void;
}

export function MediaLibrary({
  onSelect,
  maxSelectable = 1,
  currentlySelected = [],
  onClose
}: MediaLibraryProps) {
  // State management
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentlySelected));
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortField, setSortField] = useState<MediaLibrarySortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Fetch media library items
  const fetchItems = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: reset ? "1" : page.toString(),
        limit: "20",
        sortField,
        sortDirection,
        ...(search ? { search } : {})
      });

      const response = await fetch(`/api/gallery?${searchParams}`); // Update to use gallery endpoint
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
  }, [page, search, sortField, sortDirection]);

  // Initial fetch
  useEffect(() => {
    fetchItems(true);
  }, [search, sortField, sortDirection, fetchItems]);

  // Handle image selection
  const handleImageSelect = (item: MediaLibraryItem) => {
    const newSelected = new Set(selectedIds);
    
    if (newSelected.has(item.public_id)) {
      newSelected.delete(item.public_id);
    } else {
      if (newSelected.size >= maxSelectable) {
        if (maxSelectable === 1) {
          newSelected.clear();
        } else {
          return; // Don't add if we're at the limit
        }
      }
      newSelected.add(item.public_id);
    }
    
    setSelectedIds(newSelected);
  };

  // Handle image upload
  const handleUpload = async (result: CloudinaryUploadResult) => {
    if (result.event !== "success" || !result.info) return;
    
    try {
      setUploading(true);
      // Fetch the updated library to include the new image
      await fetchItems(true);
    } finally {
      setUploading(false);
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Handle sort
  const handleSort = (field: MediaLibrarySortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with search and upload */}
      <div className="flex items-center justify-between gap-4">
        <Input
          type="search"
          placeholder="Search images..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
        <CloudinaryUploadWidget
          onUploadSuccess={handleUpload}
          options={galleryUploadOptions} // Update to use gallery upload options
          buttonText={uploading ? "Uploading..." : "Upload New"}
          disabled={uploading}
        />
      </div>

      {/* Sort controls */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSort("createdAt")}
        >
          Date {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSort("usageCount")}
        >
          Usage {sortField === "usageCount" && (sortDirection === "asc" ? "↑" : "↓")}
        </Button>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.public_id}
            className={cn(
              "group relative aspect-[1.91/1] overflow-hidden rounded-lg border",
              "cursor-pointer transition-all hover:opacity-90",
              selectedIds.has(item.public_id) && "ring-2 ring-primary"
            )}
            onClick={() => handleImageSelect(item)}
          >
            <CldImage
              src={item.public_id}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              alt={item.altText || "Quote background"}
              className="object-cover"
            />
            
            {selectedIds.has(item.public_id) && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary" />
              </div>
            )}

            {/* Image info overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs truncate">{item.title || "Untitled"}</p>
              <p className="text-xs text-gray-300">Used: {item.usageCount} times</p>
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

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => {
            const selectedImages = items.filter(item => 
              selectedIds.has(item.public_id)
            );
            onSelect(selectedImages);
          }}
          disabled={selectedIds.size === 0}
        >
          {selectedIds.size === 0 ? "Select Images" : `Use ${selectedIds.size} Selected`}
        </Button>
      </div>
    </div>
  );
}