"use client";

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
import { useState } from "react";
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

  const handleUploadSuccess = (result: CloudinaryUploadResult) => {
    setUploading(false); // Set uploading to false when upload completes
    if (result.event !== "success") return;
    // Refresh the gallery grid to show new image
    // We'll implement this later with grid methods
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