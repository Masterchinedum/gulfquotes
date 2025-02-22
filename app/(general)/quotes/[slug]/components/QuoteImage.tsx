// app/(general)/quotes/[slug]/components/QuoteImage.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";
import { QuoteBgSelector } from "./QuoteBgSelector";
import type { GalleryItem } from "@/types/gallery";

interface QuoteImageProps {
  content: string;
  author: string;
  backgroundImage: string | null;
  galleryImages: GalleryItem[];
  siteName?: string;
}

export function QuoteImage({ 
  content, 
  author, 
  backgroundImage,
  galleryImages,
  siteName = "Quoticon"
}: QuoteImageProps) {
  const [selectedBg, setSelectedBg] = useState(backgroundImage);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    // TODO: Implement download functionality
    setIsGenerating(true);
    // Add download logic here
    setIsGenerating(false);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Image Version</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download"}
          </Button>
        </div>
      </div>

      {/* Quote Preview */}
      <div className="relative aspect-square rounded-lg overflow-hidden">
        {selectedBg ? (
          <Image
            src={selectedBg}
            alt="Quote background"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        
        {/* Quote Overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-8">
          <div className="text-center text-white space-y-4 max-w-[80%]">
            <p className="text-xl font-medium">&ldquo;{content}&rdquo;</p>
            <p className="text-sm">- {author}</p>
            <p className="text-xs text-white/70">{siteName}</p>
          </div>
        </div>
      </div>

      {/* Background Selection */}
      <QuoteBgSelector
        currentBackground={selectedBg}
        galleryImages={galleryImages}
        onSelect={setSelectedBg}
        disabled={isGenerating}
      />
    </Card>
  );
}