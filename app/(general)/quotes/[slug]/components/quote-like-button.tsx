"use client";

import React, { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuoteLikeButtonProps {
  initialLikes: number;
  quoteId: string;
  className?: string;
}

export function QuoteLikeButton({
  initialLikes = 0,
  quoteId,
  className,
}: QuoteLikeButtonProps) {
  // Client-side state for likes count and liked status
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Sync with latest data from API if needed
    const fetchLatestLikes = async () => {
      const response = await fetch(`/api/quotes/${quoteId}/likes`);
      const data = await response.json();
      setLikes(data.likes);
    };
    fetchLatestLikes();
  }, [quoteId]);

  // Function to handle liking/unliking
  const handleLikeToggle = () => {
    // Set animation state
    setIsAnimating(true);
    
    // Toggle liked state
    setIsLiked((prev) => !prev);
    
    // Update likes count
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    
    // API call placeholder - would normally save to database
    // For now, we'll just log to console
    console.log(`${isLiked ? 'Unlike' : 'Like'} quote: ${quoteId}`);
    
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 500);
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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={handleLikeToggle}
        variant="ghost"
        size="sm"
        className={cn(
          "group relative flex items-center gap-2 hover:bg-transparent",
          isLiked && "text-red-500"
        )}
      >
        <div className="relative">
          {/* Base heart icon */}
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
  );
}