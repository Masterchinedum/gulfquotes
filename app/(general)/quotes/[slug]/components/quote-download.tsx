// app/(general)/quotes/[slug]/components/quote-download.tsx
"use client"

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteDownloadProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onBeforeDownload?: () => void;
  onAfterDownload?: () => void;
  className?: string;
  filename?: string;
}

interface DownloadOptions {
  format: 'png' | 'jpg';
  quality?: number;
  scale?: number;
}

export function QuoteDownload({
  containerRef,
  onBeforeDownload,
  onAfterDownload,
  className,
  filename = "quote"
}: QuoteDownloadProps) {
  // Generate image from DOM element
  const generateImage = useCallback(async (options: DownloadOptions): Promise<string> => {
    if (!containerRef.current) {
      throw new Error("Container element not found");
    }

    try {
      // Canvas configuration
      const canvas = await html2canvas(containerRef.current, {
        width: 1080,
        height: 1080,
        scale: options.scale || 2, // Higher quality
        useCORS: true, // Handle cross-origin images
        allowTaint: true,
        backgroundColor: null,
      });

      // Generate data URL with specified format and quality
      if (options.format === 'jpg') {
        return canvas.toDataURL('image/jpeg', options.quality || 0.9);
      }
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Image generation error:", error);
      throw new Error("Failed to generate image");
    }
  }, [containerRef]);

  // Handle download
  const handleDownload = useCallback(async (options: DownloadOptions) => {
    try {
      onBeforeDownload?.();

      // Generate image data URL
      const dataUrl = await generateImage(options);

      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.${options.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Image downloaded successfully");
      onAfterDownload?.();
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  }, [filename, generateImage, onBeforeDownload, onAfterDownload]);

  // Handle high quality download
  const handleHighQualityDownload = useCallback(async (format: 'png' | 'jpg') => {
    await handleDownload({
      format,
      quality: 1.0,
      scale: 3 // 3x scale for high resolution
    });
  }, [handleDownload]);

  // Handle standard quality download
  const handleStandardDownload = useCallback(async (format: 'png' | 'jpg') => {
    await handleDownload({
      format,
      quality: 0.9,
      scale: 2 // 2x scale for standard resolution
    });
  }, [handleDownload]);

  // Handle web optimized download
  const handleWebOptimizedDownload = useCallback(async (format: 'png' | 'jpg') => {
    await handleDownload({
      format,
      quality: 0.8,
      scale: 1.5 // 1.5x scale for web optimization
    });
  }, [handleDownload]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* High Quality Downloads */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">High Quality</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleHighQualityDownload('png')}
          >
            <Download className="h-4 w-4 mr-2" />
            PNG (Best Quality)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleHighQualityDownload('jpg')}
          >
            <Download className="h-4 w-4 mr-2" />
            JPG (High Quality)
          </Button>
        </div>
      </div>

      {/* Standard Downloads */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Standard</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleStandardDownload('png')}
          >
            <Download className="h-4 w-4 mr-2" />
            PNG (Standard)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleStandardDownload('jpg')}
          >
            <Download className="h-4 w-4 mr-2" />
            JPG (Standard)
          </Button>
        </div>
      </div>

      {/* Web Optimized Downloads */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Web Optimized</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleWebOptimizedDownload('png')}
          >
            <Download className="h-4 w-4 mr-2" />
            PNG (Web)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleWebOptimizedDownload('jpg')}
          >
            <Download className="h-4 w-4 mr-2" />
            JPG (Web)
          </Button>
        </div>
      </div>
    </div>
  );
}