"use client";

import { useState, useCallback } from "react";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { Button } from "@/components/ui/button";
import { quoteUploadOptions } from "@/lib/cloudinary";
import { ImagePlus, Loader2 } from "lucide-react";
import type { CloudinaryUploadResult } from "@/types/cloudinary";

interface QuoteImageUploadProps {
  onUploadComplete: (result: CloudinaryUploadResult) => void;
  disabled?: boolean;
  isUploading?: boolean; // Add this prop
  maxFiles?: number;
}

export function QuoteImageUpload({
  onUploadComplete,
  disabled = false,
  isUploading = false, // Add default value
  maxFiles = 30
}: QuoteImageUploadProps) {
  const [localUploading, setLocalUploading] = useState(false);
  const isLoading = localUploading || isUploading; // Combine both upload states

  const handleUploadSuccess = useCallback((result: CloudinaryUploadResult) => {
    setLocalUploading(false);
    onUploadComplete(result);
  }, [onUploadComplete]);

  return (
    <div className="flex justify-end mb-4">
      <CloudinaryUploadWidget
        onUploadSuccess={handleUploadSuccess}
        options={{
          ...quoteUploadOptions,
          maxFiles: maxFiles,
          tags: ['quote-background'],
          context: {
            alt: 'Quote background',
            isGlobal: 'true'
          }
        }}
        disabled={disabled || isLoading}
      >
        {({ open }) => (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLocalUploading(true);
              open();
            }}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4 mr-2" />
                Upload New Image
              </>
            )}
          </Button>
        )}
      </CloudinaryUploadWidget>
    </div>
  );
}