"use client";

import { CldImage } from "next-cloudinary";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imageTransforms, getImagePublicId } from "@/lib/cloudinary";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";
import type { CloudinaryUploadResult } from "@/types/cloudinary";

interface ImagePreviewProps {
  images: CloudinaryUploadResult[];
  onDelete: (publicId: string) => void;
  disabled?: boolean;
}

export function ImagePreview({ images, onDelete, disabled = false }: ImagePreviewProps) {
  if (!images.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {images.map((image) => {
        if (image.event !== "success" || !image.info) return null;
        
        const info = image.info as CloudinaryUploadWidgetInfo;
        const publicId = getImagePublicId(info.secure_url);
        if (!publicId) return null;

        return (
          <div key={publicId} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden">
              <CldImage
                src={publicId}
                width={imageTransforms.preview.width}
                height={imageTransforms.preview.height}
                alt="Author profile image"
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover w-full h-full"
              />
            </div>
            
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(publicId)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        );
      })}
    </div>
  );
}