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
}

export function QuoteDownload({
  containerRef,
  onBeforeDownload,
  onAfterDownload,
  className,
  filename,
}: QuoteDownloadProps) {
  const { 
    downloadImage, 
    isLoading, 
    progress
  } = useQuoteDownload({
    containerRef,
    onPrepareDownload: onBeforeDownload,
    onDownloadComplete: onAfterDownload,
    filename
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Download Progress */}
      {isLoading && (
        <Progress value={progress} className="h-2" />
      )}

      {/* Single Download Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadImage('png')}
        disabled={isLoading}
        className="w-full"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Quote
      </Button>
    </div>
  );
}