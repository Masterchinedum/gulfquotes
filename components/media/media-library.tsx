"use client";

import { useCallback, useEffect, useState } from "react";
import { CldImage } from "next-cloudinary";
import { Check, Loader2 } from "lucide-react";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { galleryUploadOptions } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";
import type { CloudinaryUploadResult } from "@/types/cloudinary";

interface MediaLibraryProps {
  onSelect: (images: GalleryItem[]) => void;
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
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentlySelected));
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortField, setSortField] = useState<"createdAt" | "usageCount">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch gallery items
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

      const response = await fetch(`/api/gallery?${searchParams}`);
      if (!response.ok) throw new Error("Failed to fetch images");

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      setItems(prev => reset ? data.data.items : [...prev, ...data.data.items]);
      setHasMore(data.data.hasMore);
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
  const handleImageSelect = (item: GalleryItem) => {
    const newSelected = new Set(selectedIds);
    
    if (newSelected.has(item.publicId)) {
      newSelected.delete(item.publicId);
    } else {
      if (newSelected.size >= maxSelectable) {
        if (maxSelectable === 1) {
          newSelected.clear();
        } else {
          return;
        }
      }
      newSelected.add(item.publicId);
    }
    
    setSelectedIds(newSelected);
  };

  // Handle image upload
  const handleUpload = async (result: CloudinaryUploadResult) => {
    setUploading(true);
    try {
      if (result.event !== "success" || !result.info || typeof result.info === 'string') {
        throw new Error("Upload failed");
      }

      // Create gallery item
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.info.secure_url,
          publicId: result.info.public_id,
          format: result.info.format,
          width: result.info.width,
          height: result.info.height,
          bytes: result.info.bytes,
          isGlobal: true,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save image');
      }

      // Refresh the gallery
      await fetchItems(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with search and upload */}
      <div className="flex items-center justify-between gap-4">
        <Input
          type="search"
          placeholder="Search gallery..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <CloudinaryUploadWidget
          onUploadSuccess={handleUpload}
          options={galleryUploadOptions}
          disabled={uploading}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploading(true);
                open();
              }}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload New"
              )}
            </Button>
          )}
        </CloudinaryUploadWidget>
      </div>

      {/* Sort controls */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (sortField === "createdAt") {
              setSortDirection(prev => prev === "asc" ? "desc" : "asc");
            } else {
              setSortField("createdAt");
              setSortDirection("desc");
            }
          }}
        >
          Date {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (sortField === "usageCount") {
              setSortDirection(prev => prev === "asc" ? "desc" : "asc");
            } else {
              setSortField("usageCount");
              setSortDirection("desc");
            }
          }}
        >
          Usage {sortField === "usageCount" && (sortDirection === "asc" ? "↑" : "↓")}
        </Button>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
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

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={() => {
            const selectedImages = items.filter(item => 
              selectedIds.has(item.publicId)
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