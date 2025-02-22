// app/(general)/quotes/[slug]/components/QuoteImage.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Download } from "lucide-react";

interface QuoteImageProps {
  content: string;
  author: string;
  backgroundImage: string | null;
  siteName?: string;
}

export function QuoteImage({ 
  content, 
  author, 
  backgroundImage,
  siteName = "Quoticon"
}: QuoteImageProps) {
  const [selectedBg, setSelectedBg] = useState(backgroundImage);

  // We'll implement these functions in the next phase
  const handleDownload = () => {
    // TODO: Implement download functionality
  };

  const handleShare = () => {
    // TODO: Implement share functionality
  };

  return (
    <Card className="p-6 space-y-4">
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
          >
            <Download className="h-4 w-4 mr-2" />
            Download
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Background Style</label>
        <Select
          value={selectedBg || "default"}
          onValueChange={(value) => setSelectedBg(value === "default" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select background" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Gradient</SelectItem>
            {backgroundImage && (
              <SelectItem value={backgroundImage}>Custom Background</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}