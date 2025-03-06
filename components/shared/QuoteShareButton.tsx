// components/shared/QuoteShareButton.tsx
"use client";

import React, { useState } from "react";
import { Share2, X, Twitter, Facebook, Linkedin, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuoteShareButtonProps {
  quoteSlug: string;
  quoteContent: string;
  authorName?: string;
  className?: string;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export function QuoteShareButton({
  quoteSlug,
  quoteContent,
  authorName = "Unknown",
  className,
}: QuoteShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available sharing platforms
  const platforms: SharePlatform[] = [
    {
      id: "twitter",
      name: "Twitter",
      icon: <Twitter className="h-4 w-4 mr-2" />,
      color: "hover:bg-[#1DA1F2] hover:text-white",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="h-4 w-4 mr-2" />,
      color: "hover:bg-[#4267B2] hover:text-white",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="h-4 w-4 mr-2" />,
      color: "hover:bg-[#0077b5] hover:text-white",
    }
  ];

  // Handle social sharing
  const handleShare = async (platformId: string) => {
    setError(null);
    try {
      setIsLoading(true);
      
      const baseUrl = window.location.origin;
      const quoteUrl = `${baseUrl}/quotes/${quoteSlug}`;
      const encodedQuoteText = encodeURIComponent(quoteContent);
      const encodedAuthorName = encodeURIComponent(authorName);
      
      let shareUrl = '';
      
      switch (platformId) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedQuoteText}%20-%20${encodedAuthorName}&url=${quoteUrl}`;
          break;
          
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${quoteUrl}`;
          break;
          
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${quoteUrl}`;
          break;
          
        default:
          throw new Error("Invalid platform specified");
      }
      
      // Open share URL in new window
      const newWindow = window.open(shareUrl, '_blank');
      if (!newWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }
      
      // Track the share by calling API
      const response = await fetch(`/api/quotes/${quoteSlug}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Share tracking failed, but sharing window was opened", errorData);
        // We don't throw here since the sharing window is already open
      }
      
      toast.success(`Shared on ${platforms.find(p => p.id === platformId)?.name}`);
    } catch (error) {
      console.error("Share error:", error);
      setError(error instanceof Error ? error.message : "Failed to share quote");
      toast.error(error instanceof Error ? error.message : "Failed to share quote");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL copy
  const handleCopyUrl = async () => {
    setError(null);
    try {
      const url = `${window.location.origin}/quotes/${quoteSlug}`;
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      toast.success("Quote URL copied to clipboard");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
      setError("Failed to copy URL - clipboard access denied");
      toast.error("Failed to copy URL to clipboard");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("hover:bg-transparent", className)}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Quote</DialogTitle>
            <DialogDescription>
              Share this quote on your favorite platforms
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="p-4 border rounded-md bg-muted/20 my-2">
            <p className="italic text-sm">&quot;{quoteContent.length > 100 ? quoteContent.substring(0, 100) + '...' : quoteContent}&quot;</p>
            <p className="text-xs text-muted-foreground mt-1">— {authorName}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-2">
            {platforms.map((platform) => (
              <Button
                key={platform.id}
                variant="outline"
                className={cn(
                  "flex items-center justify-center transition-colors",
                  platform.color
                )}
                onClick={() => handleShare(platform.id)}
                disabled={isLoading}
              >
                {platform.icon}
                <span className="sr-only sm:not-sr-only sm:ml-1 sm:text-xs">
                  {platform.name}
                </span>
              </Button>
            ))}
          </div>
          
          <DialogFooter className="flex justify-between items-center mt-4 pt-3 border-t">
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
            
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="ml-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}