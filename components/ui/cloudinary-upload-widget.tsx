"use client";

import { useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cloudinaryConfig, defaultUploadOptions } from "@/lib/cloudinary";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import { ImagePlus } from "lucide-react";

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadError,
  disabled = false
}: CloudinaryUploadWidgetProps) {
  const handleUploadSuccess = useCallback((result: CloudinaryUploadResponse) => {
    if (result.event !== "success") return;

    const uploadInfo = result.info;
    
    onUploadSuccess({
      secure_url: uploadInfo.secure_url,
      public_id: uploadInfo.public_id,
    });
  }, [onUploadSuccess]);

  const handleUploadError = useCallback((error: Error) => {
    console.error("Upload error:", error);
    onUploadError?.(error);
  }, [onUploadError]);

  return (
    <CldUploadWidget
      uploadPreset={cloudinaryConfig.uploadPreset}
      options={{
        ...defaultUploadOptions,
        maxFiles: cloudinaryConfig.maxFiles,
        folder: cloudinaryConfig.folder,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        sources: ["local", "url", "camera"],
        maxFileSize: 7000000, // 7MB
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