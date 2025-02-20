"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaLibrary } from "./media-library";
import type { GalleryItem } from "@/types/gallery";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (images: GalleryItem[]) => void;
  maxSelectable?: number;
  currentlySelected?: string[];
  title?: string;
  description?: string;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  maxSelectable = 1,
  currentlySelected = [],
  title = "Media Library",
  description = "Select images from your gallery"
}: MediaLibraryModalProps) {
  const handleSelect = (images: GalleryItem[]) => {
    onSelect(images);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <MediaLibrary
            onSelect={handleSelect}
            maxSelectable={maxSelectable}
            currentlySelected={currentlySelected}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}