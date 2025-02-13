"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cloudinaryConfig, profileUploadOptions, getImagePublicId, deleteImage } from "@/lib/cloudinary";
import { ImagePlus, X } from "lucide-react";
import { CldImage } from "next-cloudinary";
import type { CloudinaryUploadResult, CloudinaryUploadWidgetInfo } from "@/types/cloudinary";

interface ProfileImageUploadProps {
  imageUrl?: string;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ProfileImageUpload({ imageUrl, onImageChange, disabled = false }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl || null);

  const handleUploadSuccess = (result: CloudinaryUploadResult) => {
    if (result.event !== "success" || !result.info) return;

    const info = result.info as CloudinaryUploadWidgetInfo;
    const newImageUrl = info.secure_url;

    // Update state and notify parent component
    setCurrentImage(newImageUrl);
    onImageChange(newImageUrl);
  };

  const handleRemoveImage = async () => {
    if (currentImage) {
      const publicId = getImagePublicId(currentImage);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    // Update state and notify parent component
    setCurrentImage(null);
    onImageChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Profile Image</div>
      {currentImage ? (
        <div className="relative group">
          <div className="aspect-square rounded-lg overflow-hidden">
            <CldImage
              src={currentImage}
              width={150}
              height={150}
              alt="Profile image"
              className="object-cover w-full h-full"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
      ) : (
        <CldUploadWidget
          uploadPreset={cloudinaryConfig.uploadPreset}
          options={profileUploadOptions}
          onSuccess={handleUploadSuccess}
          onOpen={() => setUploading(true)}
          onClose={() => setUploading(false)}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              onClick={() => open()}
              disabled={disabled || uploading}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          )}
        </CldUploadWidget>
      )}
    </div>
  );
}