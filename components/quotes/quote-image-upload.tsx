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
  maxFiles?: number;
}

export function QuoteImageUpload({
  onUploadComplete,
  disabled = false,
  maxFiles = 30
}: QuoteImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUploadSuccess = useCallback((result: CloudinaryUploadResult) => {
    setUploading(false);
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
        disabled={disabled || uploading}
      >
        {({ open }) => (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setUploading(true);
              open();
            }}
            disabled={disabled || uploading}
          >
            {uploading ? (
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