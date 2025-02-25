// app/(general)/quotes/[slug]/components/quote-actions.tsx
"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";
import { QuoteBackgroundSwitcher } from "./quote-background-switcher";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteActionsProps {
  quote: QuoteDisplayData;
  backgrounds: Gallery[];
  activeBackground: Gallery | null;
  onBackgroundChange: (background: Gallery) => Promise<void>;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function QuoteActions({
  quote,
  backgrounds,
  activeBackground,
  onBackgroundChange,
  containerRef,
  className
}: QuoteActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("backgrounds");

  // Handle download
  const handleDownload = async (format: 'png' | 'jpg') => {
    try {
      setIsLoading(true);
      
      // Make sure we have a reference to the quote container
      if (!containerRef.current) {
        throw new Error("Quote container not found");
      }

      // Get the image data from the API
      const response = await fetch(`/api/quotes/${quote.slug}/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          format,
          dataUrl: containerRef.current.innerHTML // This will be processed by html2canvas in the API
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to download quote");
      }

      // Create a temporary link to trigger the download
      const link = document.createElement("a");
      link.href = result.data.url;
      link.download = `quote-${quote.slug}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Quote downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download quote");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social sharing
  const handleShare = async (platform: string) => {
    try {
      setIsLoading(true);

      // Make sure we have a reference to the quote container
      if (!containerRef.current) {
        throw new Error("Quote container not found");
      }

      // Get the share URL from the API
      const response = await fetch(`/api/quotes/${quote.slug}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          platform,
          imageDataUrl: containerRef.current.innerHTML // For platforms that need images
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to share quote");
      }

      // Open the share URL in a new window
      window.open(result.data.shareUrl, '_blank');
      toast.success(`Shared on ${platform}`);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share quote");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle background change
  const handleBackgroundSelect = async (background: Gallery) => {
    try {
      setIsLoading(true);
      await onBackgroundChange(background);
      toast.success("Background updated successfully");
    } catch (error) {
      console.error("Background update error:", error);
      toast.error("Failed to update background");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Action Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backgrounds">
            <ImageIcon className="h-4 w-4 mr-2" />
            Backgrounds
          </TabsTrigger>
          <TabsTrigger value="share">
            <Share2 className="h-4 w-4 mr-2" />
            Share & Download
          </TabsTrigger>
        </TabsList>

        {/* Background Selection */}
        {activeTab === "backgrounds" && (
          <div className="pt-4">
            <QuoteBackgroundSwitcher
              backgrounds={backgrounds}
              activeBackground={activeBackground}
              onBackgroundChange={handleBackgroundSelect}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Share & Download Options */}
        {activeTab === "share" && (
          <div className="pt-4 flex flex-wrap gap-4">
            {/* Download Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDownload("png")}>
                  Download as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("jpg")}>
                  Download as JPG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleShare("twitter")}>
                  Share on Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("facebook")}>
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                  Share on LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("pinterest")}>
                  Share on Pinterest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </Tabs>
    </div>
  );
}