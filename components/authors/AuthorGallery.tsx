// components/authors/AuthorGallery.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageLightbox } from "./ImageLightbox";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Used for scrolling controls
  const scrollAmount = 300;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
  
  // Handle scroll left
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const newPosition = Math.max(0, scrollPosition - scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };
  
  // Handle scroll right
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };
  
  // Update scroll position when scrolling manually
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Photos</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="space-y-3">
            {images.length > 4 && (
              <div className="flex justify-end gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={scrollLeft}
                  disabled={scrollPosition <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={scrollRight}
                  disabled={scrollContainerRef.current ? 
                    scrollPosition >= scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth : 
                    false}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div 
              className="overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <div className={cn(
                "grid gap-4", 
                images.length > 4 ? "grid-flow-col auto-cols-[180px]" : 
                "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              )}>
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
                      sizes="(max-width: 768px) 180px, 180px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
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