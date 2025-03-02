// components/quotes/like-button.tsx
"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface LikeButtonProps {
  quoteId: string;
  isLiked: boolean;
  onLike: (isLiked: boolean) => void;
  className?: string;
}

export function LikeButton({ 
  quoteId, 
  isLiked, 
  onLike, 
  className 
}: LikeButtonProps) {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleLike = async () => {
    if (status !== "authenticated") {
      toast.error("Please sign in to like quotes");
      return;
    }

    try {
      setIsLoading(true);
      
      // Make API call to toggle like
      const response = await fetch(`/api/quotes/${quoteId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like quote');
      }

      const data = await response.json();
      
      // Call the onLike callback with the new state
      onLike(data.data?.liked || false);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Something went wrong");
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
      onClick={handleToggleLike}
    >
      <ThumbsUp 
        className={cn(
          "h-[18px] w-[18px] transition-colors",
          isLiked 
            ? "fill-primary text-primary" 
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
    </Button>
  );
}