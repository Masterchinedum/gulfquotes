// app/(general)/quotes/[slug]/components/quote-share.tsx
"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Linkedin as LinkedinIcon,
  Copy,
  Check,
  Share2 // Use Share2 instead of Pinterest since it's not available
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteShareProps {
  quote: QuoteDisplayData;
  containerRef: React.RefObject<HTMLDivElement>;
  onShareStart?: () => void;
  onShareComplete?: () => void;
  className?: string;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
}

export function QuoteShare({
  quote,
  containerRef,
  onShareStart,
  onShareComplete,
  className
}: QuoteShareProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  // Available sharing platforms
  const platforms: SharePlatform[] = [
    {
      id: "twitter",
      name: "Twitter",
      icon: <TwitterIcon className="h-5 w-5" />,
      color: "hover:bg-[#1DA1F2] hover:text-white",
      enabled: true
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <FacebookIcon className="h-5 w-5" />,
      color: "hover:bg-[#4267B2] hover:text-white",
      enabled: true
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <LinkedinIcon className="h-5 w-5" />,
      color: "hover:bg-[#0077b5] hover:text-white",
      enabled: true
    },
    {
      id: "pinterest",
      name: "Pinterest",
      icon: <Share2 className="h-5 w-5" />, // Use Share2 icon as a fallback
      color: "hover:bg-[#E60023] hover:text-white",
      enabled: !!quote.gallery.find(g => g.isActive)
    }
  ];

  // Handle social sharing
  const handleShare = async (platformId: string) => {
    try {
      setIsLoading(true);
      onShareStart?.();

      if (!containerRef.current) {
        throw new Error("Quote container not found");
      }

      const response = await fetch(`/api/quotes/${quote.slug}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          platform: platformId,
          imageDataUrl: containerRef.current.innerHTML
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to share quote");
      }

      // Open share URL in new window
      window.open(result.data.shareUrl, '_blank');
      toast.success(`Shared on ${platforms.find(p => p.id === platformId)?.name}`);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share quote");
    } finally {
      setIsLoading(false);
      onShareComplete?.();
    }
  };

  // Handle URL copy
  const handleCopyUrl = async () => {
    try {
      const url = `${window.location.origin}/quotes/${quote.slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      toast.success("Quote URL copied to clipboard");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Share Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>Share Quote</CardTitle>
          <CardDescription>
            Share this quote on your favorite social platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Share Preview */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview</p>
              <div className="space-y-2">
                <p className="text-base italic">&quot;{quote.content}&quot;</p>
                <p className="text-sm text-muted-foreground">
                  — {quote.authorProfile?.name || "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Share Buttons Grid */}
          <div className="grid grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <Button
                key={platform.id}
                variant="outline"
                className={cn(
                  "flex items-center justify-center gap-2 transition-colors",
                  platform.color,
                  !platform.enabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => platform.enabled && handleShare(platform.id)}
                disabled={isLoading || !platform.enabled}
              >
                {platform.icon}
                {platform.name}
              </Button>
            ))}
          </div>

          {/* Copy URL Button */}
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyUrl}
              disabled={isLoading}
            >
              {copiedUrl ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}