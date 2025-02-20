"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "./GalleryGrid";
import type { GalleryItem } from "@/types/gallery";
import { cloudinaryConfig } from "@/lib/cloudinary";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import { Loader2, ImagePlus } from "lucide-react";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (images: GalleryItem[]) => void;
  maxSelectable?: number;
  currentlySelected?: string[];
  title?: string;
  description?: string;
}

export function GalleryModal({
  isOpen,
  onClose,
  onSelect,
  maxSelectable = 1,
  currentlySelected = [],
  title = "Gallery",
  description = "Select images from your gallery or upload new ones"
}: GalleryModalProps) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Fetch gallery items
  const fetchGalleryItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const searchParams = new URLSearchParams();
      if (search) searchParams.set('search', search);

      const response = await fetch(`/api/gallery?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch images');

      const data = await response.json();
      setItems(data.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  // Fetch items when search changes
  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems]);

  const handleUploadSuccess = async (result: CloudinaryUploadResult) => {
    setUploading(false);
    if (result.event !== "success" || !result.info || typeof result.info === 'string') return;

    try {
      // Now TypeScript knows result.info is CloudinaryUploadWidgetInfo
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
          isGlobal: true, // Add this to match CreateGalleryInput
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save image');
      }
      
      // Refetch gallery items to show the new upload
      await fetchGalleryItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save image');
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (selectedImages: GalleryItem[]) => {
    onSelect(selectedImages);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between gap-4 py-4">
          <Input
            type="search"
            placeholder="Search gallery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <CloudinaryUploadWidget
            onUploadSuccess={handleUploadSuccess}
            options={{
              ...cloudinaryConfig.limits.gallery,
              folder: 'gallery',
              tags: ['gallery'],
            }}
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
                  <>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Upload New
                  </>
                )}
              </Button>
            )}
          </CloudinaryUploadWidget>
        </div>

        <div className="flex-1 overflow-y-auto">
          <GalleryGrid
            items={items}
            isLoading={isLoading}
            error={error}
            searchQuery={search}
            maxSelectable={maxSelectable}
            currentlySelected={currentlySelected}
            onSelect={handleSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}