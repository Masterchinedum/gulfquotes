"use client";

import { useState } from "react"; // Added useEffect
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react"; // Removed unused imports
import { QuoteGalleryModal } from "@/components/quotes/quote-gallery-modal";
import type { GalleryItem } from "@/types/gallery";

interface BackgroundGalleryProps {
  currentBackground: string | null;
  onSelect: (image: GalleryItem) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export function BackgroundGallery({
  currentBackground,
  onSelect,
  onRemove,
  disabled = false,
  className
}: BackgroundGalleryProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Handle background selection
  const handleSelect = (selectedImages: GalleryItem[]) => {
    const [image] = selectedImages;
    if (image) {
      onSelect(image);
    }
    setIsGalleryOpen(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Background Image</h3>
          <p className="text-sm text-muted-foreground">
            Choose a background for your quote
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsGalleryOpen(true)}
          disabled={disabled}
        >
          Browse Gallery
        </Button>
      </div>

      {/* Current Background Preview */}
      {currentBackground && (
        <div className="relative aspect-[1.91/1] rounded-lg overflow-hidden border group">
          <Image
            src={currentBackground}
            alt="Current background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute top-2 right-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={onRemove}
                disabled={disabled}
              >
                Remove Background
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentBackground && (
        <div className="aspect-[1.91/1] rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm">No background selected</p>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <QuoteGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleSelect}
        selectedImage={currentBackground}
        maxSelectable={1}
        title="Select Background"
        description="Choose a background image for your quote"
      />
    </div>
  );
}