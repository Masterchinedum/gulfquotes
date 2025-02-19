"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Check } from "lucide-react";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { quoteUploadOptions } from "@/lib/cloudinary";
import type { 
  CloudinaryUploadResult, 
  QuoteImageResource, 

} from "@/types/cloudinary";

interface ImageGalleryProps {
  images: QuoteImageResource[];
  selectedImage?: string | null;
  onSelect: (imageUrl: string) => void;
  onUpload: (result: CloudinaryUploadResult) => void;
  onDelete?: (publicId: string) => void;
  disabled?: boolean;
}

export function ImageGallery({
  images,
  selectedImage,
  onSelect,
  onUpload,
  onDelete,
  disabled = false,
}: ImageGalleryProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = (result: CloudinaryUploadResult) => {
    setUploading(false);
    onUpload(result);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Background Images</h3>
          <p className="text-sm text-muted-foreground">
            Select or upload images for your quote background
          </p>
        </div>
        <div className="flex gap-2">
          <CloudinaryUploadWidget
            onUploadSuccess={handleUpload}
            options={{
              ...quoteUploadOptions,
              tags: ['quote-background'],
              context: {
                alt: 'Quote background',
                isGlobal: 'true'
              }
            }}
            buttonText={uploading ? "Uploading..." : "Upload New"}
            disabled={disabled || uploading}
          />
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.public_id}
            className={cn(
              "group relative aspect-[1.91/1] overflow-hidden rounded-lg border",
              "transition-all hover:opacity-90",
              selectedImage === image.secure_url && "ring-2 ring-primary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <CldImage
              src={image.public_id}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              alt="Quote background"
              className="object-cover"
            />
            
            {/* Selection Indicator */}
            {selectedImage === image.secure_url && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary" />
              </div>
            )}

            {/* Actions Overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onSelect(image.secure_url)}
                disabled={disabled}
              >
                Select
              </Button>
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(image.public_id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">
            No images available. Upload some images to get started.
          </p>
        </div>
      )}
    </div>
  );
}