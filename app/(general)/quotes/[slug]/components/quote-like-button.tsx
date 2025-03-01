"use client";

import React, { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginPrompt } from "./login-prompt";

interface QuoteLikeButtonProps {
  initialLikes: number;
  quoteId: string; // This is actually the slug
  className?: string;
}

export function QuoteLikeButton({
  initialLikes = 0,
  quoteId,
  className,
}: QuoteLikeButtonProps) {
  // Authentication state
  const { status } = useSession();
  
  // Component state
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch initial like status and count
  useEffect(() => {
    const fetchLikeStatus = async () => {
      // Skip API call if not authenticated
      if (status !== "authenticated") {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/quotes/${quoteId}/like/status`);
        if (!response.ok) throw new Error("Failed to fetch like status");
        
        const data = await response.json();
        setIsLiked(data.data.liked);
        setLikes(data.data.likes);
      } catch (error) {
        console.error("Error fetching like status:", error);
        // Fallback to initialLikes if API call fails
        setLikes(initialLikes);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchLikeStatus();
  }, [quoteId, status, initialLikes]);

  // Function to handle liking/unliking
  const handleLikeToggle = async () => {
    // Require authentication
    if (status !== "authenticated") {
      // Replace the direct toast+redirect with the modal approach to match other components
      setShowLoginPrompt(true);
      return;
    }
    
    // Start animation
    setIsAnimating(true);
    
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
      
      // Optional success toast
      // toast.success(result.data.liked ? "Quote liked" : "Quote unliked");
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Revert optimistic update on error
      setIsLiked((prev) => !prev);
      setLikes((prev) => (!isLiked ? prev - 1 : prev + 1));
      
      // Show error toast
      toast.error("Failed to update like status");
    } finally {
      // Reset states
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 500);
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

  // Show skeleton loader while initial data is loading
  if (initialLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    );
  }

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
      
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          onClick={handleLikeToggle}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={cn(
            "group relative flex items-center gap-2 hover:bg-transparent",
            isLiked && "text-red-500"
          )}
        >
          <div className="relative">
            {/* Base icon */}
            <ThumbsUp 
              className={cn(
                "h-4 w-4",
                isLiked && "fill-primary text-primary"
              )}
            />
            
            {/* Animated pop effect when liking */}
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <ThumbsUp className="h-5 w-5 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Like count */}
          <span className="text-sm font-medium transition-colors text-muted-foreground group-hover:text-foreground">
            {formatLikes(likes)}
          </span>
        </Button>
      </div>
    </>
  );
}