"use client"

import React, { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Gallery } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { QuoteBackgroundSwitcher } from "./quote-background-switcher";
import { QuoteDownload } from "./quote-download";
import { QuoteShare } from "./quote-share";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteActionsProps {
  quote: QuoteDisplayData;
  backgrounds: Array<Gallery & {
    isActive?: boolean;
    isBackground?: boolean;
  }>;
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("backgrounds");

  // Simplified background change handler - no permanent changes
  const handleBackgroundChange = useCallback(async (background: Gallery) => {
    try {
      setIsLoading(true);
      // Still using async for consistency with interface
      await onBackgroundChange(background);
      
      // Updated toast to indicate temporary change
      toast({
        title: "Preview updated",
        description: "Background changed for preview and download only.",
      });
    } catch (error) {
      toast({
        title: "Error changing background",
        description: "Failed to update the preview. Please try again.",
        variant: "destructive",
      });
      console.error("Background preview error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onBackgroundChange, toast]);

  return (
    <div className={cn("space-y-4", className)}>
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

        {/* Background Selection with indicator for temporary changes */}
        {activeTab === "backgrounds" && (
          <div className="pt-4">
            {/* Visual indicator for temporary changes */}
            <div className="mb-2 p-2 bg-muted/50 rounded-md flex items-center text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 mr-2 animate-pulse text-primary/70" />
              <span>Changes are temporary and for this session only</span>
            </div>
            
            <QuoteBackgroundSwitcher
              backgrounds={backgrounds}
              activeBackground={activeBackground}
              onBackgroundChange={handleBackgroundChange}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Rest of the component remains the same */}
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

        {activeTab === "share" && (
          <div className="pt-4">
            <QuoteShare
              quote={quote}
              containerRef={containerRef}
              onShareStart={() => setIsLoading(true)}
              onShareComplete={() => setIsLoading(false)}
            />
          </div>
        )}
      </Tabs>
    </div>
  );
}