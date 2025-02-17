"use client";

import { useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cloudinaryConfig, defaultUploadOptions } from "@/lib/cloudinary";
import type { 
  CloudinaryUploadResult, 
  CloudinaryUploadWidgetError 
} from "@/types/cloudinary";
import { ImagePlus } from "lucide-react";

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: CloudinaryUploadWidgetError) => void;
  disabled?: boolean;
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadError,
  disabled = false
}: CloudinaryUploadWidgetProps) {
  const handleUploadSuccess = useCallback((result: CloudinaryUploadResult) => {
    if (result.event !== "success" || !result.info) return;
    onUploadSuccess(result);
  }, [onUploadSuccess]);

  const handleUploadError = useCallback((error: CloudinaryUploadWidgetError) => {
    console.error("Upload error:", error);
    onUploadError?.(error);
  }, [onUploadError]);

  return (
    <CldUploadWidget
      uploadPreset={cloudinaryConfig.uploadPreset}
      options={{
        ...defaultUploadOptions,
        sources: ['local', 'url', 'camera'] // Explicitly set as mutable array
      }}
      onSuccess={handleUploadSuccess}
      onError={handleUploadError}
    >
      {({ open }) => (
        <Button
          type="button"
          variant="outline"
          onClick={() => open()}
          disabled={disabled}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      )}
    </CldUploadWidget>
  );
}