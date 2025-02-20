"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QuoteImageGallery } from "./quote-image-gallery";
import type { GalleryItem } from "@/types/gallery";

interface QuoteGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (images: GalleryItem[]) => void;
  maxSelectable?: number;
  currentlySelected?: string[];
  title?: string;
  description?: string;
}

export function QuoteGalleryModal({
  isOpen,
  onClose,
  onSelect,
  maxSelectable = 1,
  currentlySelected = [],
  title = "Quote Gallery",
  description = "Select images for your quote"
}: QuoteGalleryModalProps) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Fetch gallery items
  const fetchGalleryItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const searchParams = new URLSearchParams();
      if (search) searchParams.set('search', search);
      searchParams.set('isGlobal', 'true'); // Only fetch global images

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
        </div>

        <div className="flex-1 overflow-y-auto">
          <QuoteImageGallery
            items={items}
            isLoading={isLoading}
            error={error}
            maxSelectable={maxSelectable}
            currentlySelected={currentlySelected}
            onSelect={(image) => handleSelect([image])}
            isMultiSelect={maxSelectable > 1}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}