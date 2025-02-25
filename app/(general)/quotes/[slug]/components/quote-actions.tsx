// app/(general)/quotes/[slug]/components/quote-actions.tsx
"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";
import { QuoteBackgroundSwitcher } from "./quote-background-switcher";
import { QuoteDownload } from "./quote-download";
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

  // Handle social sharing
  const handleShare = async (platform: string) => {
    try {
      setIsLoading(true);

      if (!containerRef.current) {
        throw new Error("Quote container not found");
      }

      const response = await fetch(`/api/quotes/${quote.slug}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          platform,
          imageDataUrl: containerRef.current.innerHTML
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to share quote");
      }

      window.open(result.data.shareUrl, '_blank');
      toast.success(`Shared on ${platform}`);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share quote");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backgrounds">
            <ImageIcon className="h-4 w-4 mr-2" />
            Backgrounds
          </TabsTrigger>
          <TabsTrigger value="download">
            <Download className="h-4 w-4 mr-2" />
            Download
          </TabsTrigger>
          <TabsTrigger value="share">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </TabsTrigger>
        </TabsList>

        {/* Background Selection */}
        {activeTab === "backgrounds" && (
          <div className="pt-4">
            <QuoteBackgroundSwitcher
              backgrounds={backgrounds}
              activeBackground={activeBackground}
              onBackgroundChange={onBackgroundChange}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Download Options */}
        {activeTab === "download" && (
          <div className="pt-4">
            <QuoteDownload
              containerRef={containerRef}
              filename={`quote-${quote.slug}`}
              onBeforeDownload={() => setIsLoading(true)}
              onAfterDownload={() => setIsLoading(false)}
            />
          </div>
        )}

        {/* Share Options */}
        {activeTab === "share" && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleShare("twitter")}
                disabled={isLoading}
              >
                Share on Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("facebook")}
                disabled={isLoading}
              >
                Share on Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("linkedin")}
                disabled={isLoading}
              >
                Share on LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("pinterest")}
                disabled={isLoading}
              >
                Share on Pinterest
              </Button>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}