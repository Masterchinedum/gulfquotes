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
  QuoteImageResource 
} from "@/types/cloudinary";

interface ImageGalleryProps {
  images: GalleryItem[] | QuoteImageResource[];
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

  const getPublicId = (image: GalleryItem | QuoteImageResource) => {
    return 'publicId' in image ? image.publicId : image.public_id;
  };

  const getUrl = (image: GalleryItem | QuoteImageResource) => {
    return 'url' in image ? image.url : image.secure_url;
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

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => {
          const publicId = getPublicId(image);
          const url = getUrl(image);

          return (
            <div
              key={publicId}
              className={cn(
                "group relative aspect-[1.91/1] overflow-hidden rounded-lg border",
                "transition-all hover:opacity-90",
                selectedImage === url && "ring-2 ring-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <CldImage
                src={publicId}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                alt="Quote background"
                className="object-cover"
              />
              
              {/* Selection Indicator */}
              {selectedImage === url && (
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
                  onClick={() => onSelect(url)}
                  disabled={disabled}
                >
                  Select
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(publicId)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
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