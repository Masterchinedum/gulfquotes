// components/shared/QuoteLikeButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { LoginPrompt } from "@/app/(general)/quotes/[slug]/components/login-prompt";

interface QuoteLikeButtonProps {
  initialLikes: number;
  quoteId: string; // This is the slug in TrendingQuotes context
  showCount?: boolean;
  className?: string;
}

export function QuoteLikeButton({
  initialLikes = 0,
  quoteId,
  showCount = true,
  className,
}: QuoteLikeButtonProps) {
  // Authentication state
  const { status } = useSession();
  
  // Component state
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch initial like status when authenticated
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (status !== "authenticated") return;

      try {
        const response = await fetch(`/api/quotes/${quoteId}/like`, {
          method: 'GET'
        });
        
        if (!response.ok) throw new Error("Failed to fetch like status");
        
        const data = await response.json();
        setIsLiked(data.data.liked);
        setLikes(data.data.likes);
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };

    fetchLikeStatus();
  }, [quoteId, status]);

  // Function to handle liking/unliking
  const handleLikeToggle = async () => {
    // Require authentication
    if (status !== "authenticated") {
      setShowLoginPrompt(true);
      return;
    }
    
    // Prevent multiple clicks
    if (isLoading) return;
    
    // Optimistic update
    setIsLiked((prev) => !prev);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Call API to persist the like
      const response = await fetch(`/api/quotes/${quoteId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error("Failed to toggle like");
      
      const result = await response.json();
      
      // Update with actual server state
      setIsLiked(result.data.liked);
      setLikes(result.data.likes);
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Revert optimistic update on error
      setIsLiked((prev) => !prev);
      setLikes((prev) => (!isLiked ? prev - 1 : prev + 1));
      
      // Show error toast
      toast.error("Failed to update like status");
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  // Format likes for display (e.g., 1000 -> 1K)
  const formatLikes = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <>
      {showLoginPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="max-w-md w-full">
            <LoginPrompt 
              title="Sign in to like"
              description="You need to be signed in to like quotes."
              callToAction="Sign in now"
              redirectUrl={`/quotes/${quoteId}`}
              action="like"
              targetId={quoteId}
              onClose={() => setShowLoginPrompt(false)}
            />
          </div>
        </div>
      )}
      
      <Button
        onClick={handleLikeToggle}
        variant="ghost"
        size="sm"
        disabled={isLoading}
        className={cn(
          "hover:bg-transparent",
          isLiked && "text-red-500",
          className
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4 mr-2",
            isLiked && "fill-primary text-primary"
          )} 
        />
        {showCount && formatLikes(likes)}
      </Button>
    </>
  );
}