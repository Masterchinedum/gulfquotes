"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Check, ImagePlus } from "lucide-react";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { quoteUploadOptions } from "@/lib/cloudinary";
import type { 
  CloudinaryUploadResult, 
  QuoteImageResource, 
  MediaLibraryItem 
} from "@/types/cloudinary";
import { MediaLibraryModal } from "@/components/media/media-library-modal";

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
  disabled = false
}: ImageGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = (result: CloudinaryUploadResult) => {
    setUploading(false);
    onUpload(result);
  };

  // Handle media library selection
  const handleMediaLibrarySelect = (selectedImages: MediaLibraryItem[]) => {
    // Process each selected image
    selectedImages.forEach(image => {
      onUpload({
        event: "success",
        info: {
          // Required CloudinaryUploadWidgetInfo fields
          public_id: image.public_id,
          secure_url: image.secure_url,
          original_filename: image.title || 'untitled',
          asset_id: image.public_id,
          version: 1,  // Changed to number
          version_id: 1, // Changed to number
          width: image.width,
          height: image.height,
          format: image.format,
          resource_type: 'image',
          created_at: image.created_at,
          bytes: image.bytes,
          folder: 'quote-images',
          access_mode: 'public',
          url: image.secure_url,
          context: {
            alt: image.altText,
            isGlobal: 'true'
          },
          // Add required fields from CloudinaryUploadWidgetInfo
          hook_execution: { data: {} },  // Changed to match expected type
          id: image.public_id,
          type: 'upload',
          api_key: '',
          delete_token: '',
          etag: '',
          placeholder: false,
          tags: ['quote-background'],
          path: image.secure_url,
          thumbnail_url: image.secure_url,
          signature: '',
          metadata: {},
          batchId: ''
        }
      });
    });
    
    // Close modal after selection
    setIsModalOpen(false);
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
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Browse Library
          </Button>
          <CloudinaryUploadWidget
            onUploadSuccess={handleUpload}
            options={{
              ...quoteUploadOptions,
              // Add options for global library
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

      {/* Add the MediaLibraryModal */}
      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleMediaLibrarySelect}
        maxSelectable={30 - images.length}
        currentlySelected={images.map(img => img.public_id)}
        title="Quote Background Library"
        description="Select images from your library or upload new ones to use as quote backgrounds"
      />
    </div>
  );
}