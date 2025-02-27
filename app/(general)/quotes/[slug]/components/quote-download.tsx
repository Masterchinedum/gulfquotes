// app/(general)/quotes/[slug]/components/quote-download.tsx
"use client"

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuoteDownload } from "@/hooks/use-quote-download";
import { Progress } from "@/components/ui/progress";

interface QuoteDownloadProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onBeforeDownload?: () => void;
  onAfterDownload?: () => void;
  className?: string;
  filename?: string;
  quoteSlug?: string; // Add quote slug prop
}

export function QuoteDownload({
  containerRef,
  onBeforeDownload,
  onAfterDownload,
  className,
  filename,
  quoteSlug, // Receive the slug
}: QuoteDownloadProps) {
  // Enhanced download preparation
  const handleBeforeDownload = useCallback(() => {
    if (containerRef.current) {
      // Ensure any background transitions are complete
      const transitionDuration = 500; // Match the duration from QuoteBackground
      
      // Call original callback if provided
      onBeforeDownload?.();
      
      // Force any pending transitions to complete
      const backgroundImage = containerRef.current.querySelector('.quote-background-image');
      if (backgroundImage) {
        // Ensure image is fully loaded
        backgroundImage.classList.add('download-ready');
        
        // Return a promise that resolves after transition completes
        return new Promise(resolve => {
          setTimeout(resolve, transitionDuration);
        });
      }
    }
  }, [containerRef, onBeforeDownload]);

  const { 
    downloadImage, 
    isLoading, 
    progress
  } = useQuoteDownload({
    containerRef,
    onPrepareDownload: handleBeforeDownload,
    onDownloadComplete: onAfterDownload,
    filename,
    quoteSlug // Pass it to the hook
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Download Status */}
      {isLoading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {progress < 100 ? 'Preparing download...' : 'Processing image...'}
          </p>
        </div>
      )}

      {/* Download Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadImage('png')}
        disabled={isLoading}
        className="w-full"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Quote with Current Background
      </Button>
    </div>
  );
}