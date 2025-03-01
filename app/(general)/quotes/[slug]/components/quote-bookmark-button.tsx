"use client";

import React, { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginPrompt } from "./login-prompt";

interface QuoteBookmarkButtonProps {
  initialBookmarks: number;
  quoteId: string; // This is actually the slug
  className?: string;
  showCount?: boolean;
}

export function QuoteBookmarkButton({
  initialBookmarks = 0,
  quoteId,
  className,
  showCount = true,
}: QuoteBookmarkButtonProps) {
  // Authentication state
  const { status } = useSession();
  
  // Component state
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch initial bookmark status and count
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      // Skip API call if not authenticated
      if (status !== "authenticated") {
        setInitialLoading(false);
        return;
      }

      try {
        // Use GET method for fetching status
        const response = await fetch(`/api/quotes/${quoteId}/bookmark`, {
          method: 'GET'
        });
        
        if (!response.ok) throw new Error("Failed to fetch bookmark status");
        
        const data = await response.json();
        setIsBookmarked(data.data.bookmarked);
        setBookmarks(data.data.bookmarks);
      } catch (error) {
        console.error("Error fetching bookmark status:", error);
        // Fallback to initialBookmarks if API call fails
        setBookmarks(initialBookmarks);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBookmarkStatus();
  }, [quoteId, status, initialBookmarks]);

  // Function to handle bookmarking/unbookmarking
  const handleBookmarkToggle = async () => {
    // Require authentication
    if (status !== "authenticated") {
      setShowLoginPrompt(true);
      return;
    }
    
    // Start animation
    setIsAnimating(true);
    
    // Optimistic update
    setIsBookmarked((prev) => !prev);
    setBookmarks((prev) => (isBookmarked ? prev - 1 : prev + 1));
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Call API to persist the bookmark
      const response = await fetch(`/api/quotes/${quoteId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error("Failed to toggle bookmark");
      
      const result = await response.json();
      
      // Update with actual server state
      setIsBookmarked(result.data.bookmarked);
      setBookmarks(result.data.bookmarks);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      
      // Revert optimistic update on error
      setIsBookmarked((prev) => !prev);
      setBookmarks((prev) => (!isBookmarked ? prev - 1 : prev + 1));
      
      // Show error toast
      toast.error("Failed to update bookmark status");
    } finally {
      // Reset states
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  // Format bookmarks for display (e.g., 1000 -> 1K)
  const formatBookmarks = (count: number) => {
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
              title="Sign in to bookmark"
              description="You need to be signed in to save quotes to your collection."
              callToAction="Sign in now"
              redirectUrl={`/quotes/${quoteId}`}
              action="bookmark"
              targetId={quoteId}
              onClose={() => setShowLoginPrompt(false)}
            />
          </div>
        </div>
      )}
      
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          onClick={handleBookmarkToggle}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={cn(
            "group relative flex items-center gap-2 hover:bg-transparent",
            isBookmarked && "text-primary"
          )}
        >
          <div className="relative">
            {/* Base icon */}
            <Bookmark 
              className={cn(
                "h-5 w-5",
                isBookmarked ? "fill-primary text-primary" : "fill-transparent"
              )}
            />
            
            {/* Animated pop effect when bookmarking */}
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Bookmark className="h-6 w-6 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Display text and count if needed */}
          <span className="text-sm font-medium transition-colors text-muted-foreground group-hover:text-foreground">
            {isBookmarked ? "Saved" : "Save"}
            {showCount && bookmarks > 0 && ` (${formatBookmarks(bookmarks)})`}
          </span>
        </Button>
      </div>
    </>
  );
}