"use client"

import React, { useState, useCallback } from "react";
import { Gallery } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { QuoteDownload } from "./quote-download";
import { QuoteShare } from "./quote-share";
import { QuoteBackgroundSwitcher } from "./quote-background-switcher";
import { useToast } from "@/hooks/use-toast";
import { Palette, Download, Share2, Bookmark as BookmarkIcon } from "lucide-react";
import { QuoteLikeButton } from "./quote-like-button";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

QuoteActions.whyDidYouRender = {
  logOnDifferentValues: true,
  customName: 'QuoteActions'
};

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("customize");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Remove isLoading from dependencies to prevent loops
  const handleBackgroundChange = useCallback(
    async (background: Gallery) => {
      try {
        setIsLoading(true);
        await onBackgroundChange(background);
        toast({
          title: "Background updated",
          description: "The quote background has been updated."
        });
      } catch (error) {
        console.error("Failed to update background:", error);
        toast({
          title: "Update failed",
          description: "Failed to update quote background. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onBackgroundChange, toast] // Removed isLoading from dependencies
  );

  // Memoize this to prevent unnecessary re-renders
  const handleSaveToggle = useCallback(() => {
    setIsSaved((prev) => !prev);
    toast({
      title: !isSaved ? "Quote saved to collection" : "Quote removed from collection",
      description: !isSaved 
        ? "This quote has been added to your saved collection"
        : "This quote has been removed from your saved collection"
    });
  }, [isSaved, toast]);

  // Memoize loading state handlers
  const handleLoadingStart = useCallback(() => setIsLoading(true), []);
  const handleLoadingEnd = useCallback(() => setIsLoading(false), []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick action buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Engage with this Quote</CardTitle>
          <CardDescription>Show your appreciation or save for later</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <QuoteLikeButton 
              initialLikes={quote.metrics?.likes || 0}
              quoteId={quote.id}
            />
            
            <Button
              onClick={handleSaveToggle}
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center gap-2", 
                isSaved && "text-primary"
              )}
            >
              <BookmarkIcon className={cn(
                "h-5 w-5",
                isSaved ? "fill-primary" : "fill-transparent"
              )} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced actions in tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quote Options</CardTitle>
          <CardDescription>Customize, download, or share this quote</CardDescription>
        </CardHeader>
        <CardContent className="pb-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="customize" disabled={isLoading} className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Customize</span>
              </TabsTrigger>
              
              <TabsTrigger value="download" disabled={isLoading} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </TabsTrigger>
              
              <TabsTrigger value="share" disabled={isLoading} className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab content */}
            {activeTab === "customize" && (
              <div className="py-2">
                <h3 className="text-sm font-medium mb-2">Background Options</h3>
                <QuoteBackgroundSwitcher
                  backgrounds={backgrounds}
                  activeBackground={activeBackground}
                  onBackgroundChange={handleBackgroundChange}
                  isLoading={isLoading}
                />
              </div>
            )}

            {activeTab === "download" && (
              <div className="py-2">
                <h3 className="text-sm font-medium mb-2">Download Quote Image</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Save this quote as an image to share on social media or set as wallpaper.
                </p>
                <QuoteDownload
                  containerRef={containerRef}
                  filename={`quote-${quote.slug}`}
                  quoteSlug={quote.slug}
                  onBeforeDownload={handleLoadingStart}
                  onAfterDownload={handleLoadingEnd}
                />
              </div>
            )}

            {activeTab === "share" && (
              <div className="py-2">
                <h3 className="text-sm font-medium mb-2">Share on Social Media</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Share this inspiring quote with your friends and followers.
                </p>
                <QuoteShare
                  quote={quote}
                  containerRef={containerRef}
                  onShareStart={handleLoadingStart}
                  onShareComplete={handleLoadingEnd}
                />
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
