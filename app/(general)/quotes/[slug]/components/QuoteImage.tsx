// app/(general)/quotes/[slug]/components/QuoteImage.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Download, ImageIcon, Loader2 } from "lucide-react";
import { QuoteBgSelector } from "./QuoteBgSelector";
import { quoteImageGenerator } from "@/lib/utils/imageGenerator";
import { backgroundHandler } from "@/lib/utils/backgrounds";
import { imageProcessor } from "@/lib/utils/imageProcessor"; // Import imageProcessor
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { GalleryItem } from "@/types/gallery";
import "./quote-image.css";

interface QuoteImageProps {
  content: string;
  author: string;
  backgroundImage: string | null;
  galleryImages: GalleryItem[];
  siteName?: string;
}

type ImageSize = 'original' | 'medium' | 'small';

interface DownloadOptions {
  size: ImageSize;
  width: number;
  height: number;
  quality: number;
}

const IMAGE_SIZES: Record<ImageSize, DownloadOptions> = {
  original: {
    size: 'original',
    width: 1080,
    height: 1080,
    quality: 100
  },
  medium: {
    size: 'medium',
    width: 720,
    height: 720,
    quality: 90
  },
  small: {
    size: 'small',
    width: 480,
    height: 480,
    quality: 85
  }
};

export function QuoteImage({ 
  content, 
  author, 
  backgroundImage,
  galleryImages,
  siteName = "Quoticon"
}: QuoteImageProps) {
  const [selectedBg, setSelectedBg] = useState(backgroundImage);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('original');

  // Get optimized background URL with error handling
  const backgroundUrl = selectedBg ? 
    backgroundHandler.getOptimizedUrl(selectedBg, {
      quality: 90,
      overlay: {
        color: 'black',
        opacity: 50
      }
    }) : null;

  const handleDownload = async (size: ImageSize = selectedSize) => {
    try {
      setIsGenerating(true);
      setError(null);

      const options = IMAGE_SIZES[size];
      
      // Use the image processor with optimizations
      const imageBuffer = await imageProcessor.processImage({
        content,
        author,
        siteName,
        backgroundUrl: selectedBg,
        width: options.width,
        height: options.height,
        quality: options.quality,
        format: 'png', // Use PNG for best quality
        priority: 1
      });

      // Create optimized blob
      const blob = new Blob([imageBuffer], { 
        type: 'image/png'
      });
      
      // Convert buffer to blob and create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${author.toLowerCase().replace(/\s+/g, '-')}-${size}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const imageBuffer = await quoteImageGenerator.generate({
        content,
        author,
        siteName,
        backgroundUrl: selectedBg
      });

      const blob = new Blob([imageBuffer], { type: 'image/png' });
      const file = new File([blob], 'quote.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Share Quote',
          text: `"${content}" - ${author}`
        });
      } else {
        throw new Error('Sharing not supported on this device');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to share image";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Image Version</h2>
          <p className="text-sm text-muted-foreground">
            Preview and download your quote as an image
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={isGenerating}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <div className="flex items-center gap-2">
            {Object.entries(IMAGE_SIZES).map(([key, options]) => (
              <Button
                key={key}
                variant={selectedSize === key ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedSize(key as ImageSize);
                  handleDownload(key as ImageSize);
                }}
                disabled={isGenerating}
              >
                {isGenerating && selectedSize === key ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {options.width}px
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Quote Preview */}
      <div className="relative">
        <div 
          className={cn(
            "quote-preview rounded-lg overflow-hidden",
            "transition-all duration-300",
            backgroundUrl ? "quote-preview-custom" : "quote-preview-default",
            isGenerating && "opacity-50"
          )}
        >
          {backgroundUrl ? (
            <div 
              className="quote-preview-background"
              style={{ "--quote-bg-image": `url(${backgroundUrl})` } as React.CSSProperties}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="quote-overlay backdrop-blur-[2px]">
            <div className="quote-content">
              <p className="text-xl font-medium leading-relaxed">
                &ldquo;{content}&rdquo;
              </p>
              <p className="text-sm mt-4">― {author}</p>
              <p className="text-xs text-white/70 mt-2">{siteName}</p>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Generating image...</p>
            </div>
          </div>
        )}
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