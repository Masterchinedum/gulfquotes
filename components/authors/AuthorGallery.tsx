// components/authors/AuthorGallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ImageLightbox } from "./ImageLightbox";
import { ImageIcon } from "lucide-react";

interface AuthorImage {
  id: string;
  url: string;
}

interface AuthorGalleryProps {
  images: AuthorImage[];
  authorName: string;
  className?: string;
}

export function AuthorGallery({ images, authorName, className }: AuthorGalleryProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Return early if no images
  if (!images || images.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="mx-auto bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No Images Available</h3>
            <p className="text-sm text-muted-foreground mt-1">No photos have been added for this author yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Open lightbox with selected image index
  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div 
                  key={image.id} 
                  className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(index)}
                >
                  <Image
                    src={image.url}
                    alt={`${authorName} - Photo ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        initialIndex={selectedImageIndex}
        authorName={authorName}
      />
    </>
  );
}