"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cloudinaryConfig, profileUploadOptions, getImagePublicId, deleteImage } from "@/lib/cloudinary";
import { ImagePlus, X } from "lucide-react";
import { CldImage } from "next-cloudinary";
import type { CloudinaryUploadResult, CloudinaryUploadWidgetInfo } from "@/types/cloudinary";

interface ProfileImageUploadProps {
  imageUrl?: string | null;
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
        <div className="relative group w-32 h-32">
          <div className="aspect-square rounded-lg overflow-hidden">
            <CldImage
              src={currentImage}
              width={128}
              height={128}
              alt="Profile image"
              className="object-cover w-full h-full"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity scale-75"
            onClick={handleRemoveImage}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
      ) : (
        <div className="w-32">
          <CldUploadWidget
            uploadPreset={cloudinaryConfig.uploadPreset}
            options={{
              ...profileUploadOptions,
              styles: {
                palette: {
                  window: "#ffffff",
                  windowBorder: "#90a0b3",
                  tabIcon: "#0078ff",
                  menuIcons: "#5a616a",
                  textDark: "#000000",
                  textLight: "#ffffff",
                  link: "#0078ff",
                  action: "#ff620c",
                  inactiveTabIcon: "#0e2f5a",
                  error: "#f44235",
                  inProgress: "#0078ff",
                  complete: "#20b832",
                  sourceBg: "#f4f5f5"
                },
                fonts: {
                  default: null,
                  "'Space Mono', monospace": {
                    url: "https://fonts.googleapis.com/css?family=Space+Mono",
                    active: true
                  }
                }
              },
              showPoweredBy: false,
              showAdvancedOptions: false,
              cropping: true,
              croppingAspectRatio: 1,
              showSkipCropButton: false,
              maxImageWidth: 512,
              maxImageHeight: 512
            }}
            onSuccess={handleUploadSuccess}
            onOpen={() => setUploading(true)}
            onClose={() => {
              setUploading(false);
              document.body.style.overflow = 'auto';
            }}
          >
            {({ open }) => (
              <Button
                type="button"
                variant="outline"
                onClick={() => open()}
                disabled={disabled || uploading}
                className="w-full"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            )}
          </CldUploadWidget>
        </div>
      )}
    </div>
  );
}