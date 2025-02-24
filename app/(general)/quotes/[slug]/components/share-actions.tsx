"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Download, 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Check
} from "lucide-react";
import { quoteShareService } from "@/lib/services/quote-share/quote-share.service";
import type { Quote, AuthorProfile } from "@prisma/client";

interface ShareActionsProps {
  quote: Quote & {
    authorProfile: AuthorProfile;
  };
  imageUrl: string | null;
  disabled?: boolean;
}

export function ShareActions({ quote, imageUrl, disabled = false }: ShareActionsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const shareUrl = `${window.location.origin}/quotes/${quote.slug}`;
  const shareText = `"${quote.content}" - ${quote.authorProfile.name}`;

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      await quoteShareService.download(quote, imageUrl);
      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = async (platform: string) => {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
      instagram: async () => {
        if (!imageUrl) return;
        try {
          await quoteShareService.share(quote, imageUrl, {
            title: "Share on Instagram",
            text: shareText
          });
        } catch (error) {
          console.error("Instagram share error:", error);
          throw error instanceof Error ? error : new Error("Failed to share to Instagram");
        }
      }
    };

    try {
      if (platform === 'instagram') {
        await shareUrls.instagram();
      } else {
        window.open(shareUrls[platform as keyof typeof shareUrls] as string, '_blank');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(`${platform} share error:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to share to ${platform}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      {/* Download Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={disabled || !imageUrl}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>

      {/* Share Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Share Link */}
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Social Share Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => handleSocialShare('facebook')}
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => handleSocialShare('twitter')}
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => handleSocialShare('linkedin')}
              >
                <Linkedin className="h-5 w-5" />
              </Button>
              {imageUrl && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => handleSocialShare('instagram')}
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}