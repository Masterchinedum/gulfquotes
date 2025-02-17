"use client";

import { useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cloudinaryConfig, defaultUploadOptions } from "@/lib/cloudinary";
import type { 
  CloudinaryUploadResult, 
  CloudinaryUploadWidgetError,
  CloudinaryUploadOptions  // Add this import
} from "@/types/cloudinary";
import { ImagePlus } from "lucide-react";

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: CloudinaryUploadWidgetError) => void;
  disabled?: boolean;
  options?: Partial<CloudinaryUploadOptions>; // Add this
  buttonText?: string;                        // Add this
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadError,
  disabled = false,
  options = {},                               // Add this
  buttonText = "Upload Image"                 // Add this
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
        ...options,                           // Add this
        sources: ['local', 'url', 'camera']
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
          {buttonText}
        </Button>
      )}
    </CldUploadWidget>
  );
}