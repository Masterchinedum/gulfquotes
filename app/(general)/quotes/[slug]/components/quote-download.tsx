// app/(general)/quotes/[slug]/components/quote-download.tsx
"use client"

import React from "react";
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
  quality?: 'high' | 'standard' | 'web'; // Add quality prop
}

export function QuoteDownload({
  containerRef,
  onBeforeDownload,
  onAfterDownload,
  className,
  filename,
  quality: propQuality = 'standard' // Add default value
}: QuoteDownloadProps) {
  const { 
    downloadImage, 
    setQuality, 
    isLoading, 
    progress, 
    quality 
  } = useQuoteDownload({
    containerRef,
    onPrepareDownload: onBeforeDownload,
    onDownloadComplete: onAfterDownload,
    filename,
    initialQuality: propQuality // Pass quality to hook
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quality Selection */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Quality Settings</h3>
        <div className="grid grid-cols-3 gap-4">
          <Button 
            variant={quality === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuality('high')}
          >
            High Quality
          </Button>
          <Button 
            variant={quality === 'standard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuality('standard')}
          >
            Standard
          </Button>
          <Button 
            variant={quality === 'web' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuality('web')}
          >
            Web
          </Button>
        </div>
      </div>

      {/* Download Progress */}
      {isLoading && (
        <Progress value={progress} className="h-2" />
      )}

      {/* Download Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadImage('png')}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadImage('jpg')}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Download JPG
        </Button>
      </div>
    </div>
  );
}