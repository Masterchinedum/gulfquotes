"use client";

import { CldUploadWidget } from "next-cloudinary";
import { cloudinaryConfig } from "@/lib/cloudinary-config";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { CloudinaryUploadResult } from "@/types/cloudinary";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (urls: string[]) => void;
  onRemove: (url: string) => void;
  value: string[];
  multiple?: boolean;
}

export function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value,
  multiple = false
}: ImageUploadProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onUpload = (result: CloudinaryUploadResult) => {
    if (result.event === 'success' && result.info.secure_url) {
      const url = result.info.secure_url;
      if (multiple) {
        onChange([...value, url]);
      } else {
        onChange([url]);
      }
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value.map((url) => (
          <div key={url} className="relative w-[200px] h-[200px]">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="sm"
              >
                Remove
              </Button>
            </div>
            <Image
              fill
              className="object-cover rounded-lg"
              alt="Upload"
              src={url}
            />
          </div>
        ))}
      </div>
      <CldUploadWidget
        uploadPreset={cloudinaryConfig.uploadPreset}
        onUpload={onUpload}
        options={{
          maxFiles: multiple ? 10 : 1,
          resourceType: "image",
        }}
      >
        {({ open }) => {
          const onClick = () => {
            open();
          };

          return (
            <Button
              type="button"
              disabled={disabled}
              variant="secondary"
              onClick={onClick}
            >
              Upload Image
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}