"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cloudinaryConfig, getFolder } from "@/lib/cloudinary"; // Remove unused import
import { ImagePlus, X } from "lucide-react";
import { CldImage } from "next-cloudinary";
import type { CloudinaryUploadResult, CloudinaryUploadWidgetInfo } from "@/types/cloudinary";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  imageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ProfileImageUpload({ imageUrl, onImageChange, disabled = false }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl || null);

  // Sync with external image changes
  useEffect(() => {
    setCurrentImage(imageUrl || null);
  }, [imageUrl]);

  const handleUploadSuccess = async (result: CloudinaryUploadResult) => {
    try {
      if (result.event !== "success" || !result.info) return;

      const info = result.info as CloudinaryUploadWidgetInfo;
      const newImageUrl = info.secure_url;

      // Only attempt to delete old image if it's different from the new one
      if (currentImage && currentImage !== newImageUrl) {
        try {
          const response = await fetch("/api/users/settings", {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
              image: newImageUrl 
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Failed to update profile image");
          }
        } catch (error) {
          console.error("[PROFILE_IMAGE_UPLOAD]", error);
          toast.error("Failed to update profile image");
          return;
        }
      }

      setCurrentImage(newImageUrl);
      onImageChange(newImageUrl);
      toast.success("Profile image uploaded successfully");
    } catch (error) {
      console.error("[PROFILE_IMAGE_UPLOAD]", error);
      toast.error("Failed to upload profile image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      
      if (currentImage) {
        // First, delete the image from Cloudinary
        const response = await fetch("/api/users/profile-image", {
          method: "DELETE",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            imageUrl: currentImage 
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to delete image from storage");
        }

        // Then update the user profile
        const updateResponse = await fetch("/api/users/settings", {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            image: null 
          }),
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(error.error?.message || "Failed to remove profile image");
        }
      }

      setCurrentImage(null);
      onImageChange(null);
      toast.success("Profile image removed successfully");
    } catch (error) {
      console.error("[PROFILE_IMAGE_DELETE]", error);
      toast.error("Failed to remove profile image");
    } finally {
      setUploading(false);
    }
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
            disabled={disabled || uploading}
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
              maxFiles: 1,
              folder: getFolder('profiles'),
              clientAllowedFormats: cloudinaryConfig.limits.profiles.allowedFormats,
              maxFileSize: cloudinaryConfig.limits.maxFileSize,
              sources: ['local', 'url', 'camera'],
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
                {uploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            )}
          </CldUploadWidget>
        </div>
      )}
    </div>
  );
}