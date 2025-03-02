// components/authors/ImageLightbox.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";

interface AuthorImage {
  id: string;
  url: string;
}

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: AuthorImage[];
  initialIndex: number;
  authorName: string;
}

export function ImageLightbox({ isOpen, onClose, images, initialIndex, authorName }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Reset to initial index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "ArrowLeft":
          setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
          break;
        case "ArrowRight":
          setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
          break;
        case "Escape":
          onClose();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);
  
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  // Handle download of current image
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex].url;
    link.download = `${authorName.replace(/\s+/g, '-')}-photo-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!isOpen || images.length === 0) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-background/95 backdrop-blur-sm">
        <DialogHeader className="p-4 flex-row items-center justify-between">
          <DialogTitle className="text-lg">
            {authorName} - Photo {currentIndex + 1} of {images.length}
          </DialogTitle>
          <div className="flex space-x-2">
            <Button size="icon" variant="ghost" onClick={handleDownload}>
              <Download className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative flex items-center justify-center h-[70vh] w-full">
          {/* Left arrow navigation */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute left-4 z-10" 
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          {/* Image display */}
          <div className="relative w-full h-full">
            <Image
              src={images[currentIndex].url}
              alt={`${authorName} - Photo ${currentIndex + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 90vw"
              className="object-contain"
              priority
            />
          </div>
          
          {/* Right arrow navigation */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-4 z-10" 
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Thumbnail navigation for multiple images */}
        {images.length > 1 && (
          <div className="flex p-4 space-x-2 overflow-x-auto">
            {images.map((image, index) => (
              <div 
                key={image.id}
                className={`
                  w-16 h-16 relative rounded-md overflow-hidden cursor-pointer
                  ${currentIndex === index ? "ring-2 ring-primary" : ""}
                `}
                onClick={() => setCurrentIndex(index)}
              >
                <Image
                  src={image.url}
                  alt={`${authorName} - Thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}