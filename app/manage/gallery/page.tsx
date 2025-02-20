"use client";

import { GalleryUpload } from "@/components/gallery/GalleryUpload";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import type { GalleryItem } from "@/types/gallery";
import { useState } from "react";

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([]);

  const handleUploadComplete = (newImage: GalleryItem) => {
    setImages(prev => [...prev, newImage]);
  };

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-2xl font-bold">Gallery Management</h1>
      
      <GalleryUpload 
        onUploadComplete={handleUploadComplete}
      />

      <GalleryGrid 
        images={images}
      />
    </div>
  );
}