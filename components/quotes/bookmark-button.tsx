// components/quotes/bookmark-button.tsx
"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface BookmarkButtonProps {
  quoteId: string;
  isBookmarked: boolean;
  onBookmark: (isBookmarked: boolean) => void;
  className?: string;
}

export function BookmarkButton({ 
  quoteId, 
  isBookmarked, 
  onBookmark, 
  className 
}: BookmarkButtonProps) {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleBookmark = async () => {
    if (status !== "authenticated") {
      toast.error("Please sign in to bookmark quotes");
      return;
    }

    try {
      setIsLoading(true);
      
      // Make API call to toggle bookmark
      const response = await fetch(`/api/quotes/${quoteId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to bookmark quote');
      }

      const data = await response.json();
      
      // Call the onBookmark callback with the new state
      onBookmark(data.data?.bookmarked || false);
      
      toast.success(
        data.data?.bookmarked 
          ? "Quote added to your bookmarks" 
          : "Quote removed from your bookmarks"
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error("Something went wrong while saving your bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("group", className)}
      disabled={isLoading}
      onClick={handleToggleBookmark}
    >
      <Bookmark 
        className={cn(
          "h-[18px] w-[18px] transition-colors",
          isBookmarked 
            ? "fill-primary text-primary" 
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
    </Button>
  );
}