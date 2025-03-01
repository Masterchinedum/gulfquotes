// app/(general)/authors/components/author-follow-button.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginPrompt } from "@/app/(general)/quotes/[slug]/components/login-prompt";

interface AuthorFollowButtonProps {
  initialFollowers: number;
  authorSlug: string;
  initialFollowed?: boolean;
  className?: string;
  showCount?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export function AuthorFollowButton({
  initialFollowers = 0,
  authorSlug,
  initialFollowed = false,
  className,
  showCount = false,
  size = "default",
  variant = "outline"
}: AuthorFollowButtonProps) {
  // Authentication state
  const { status } = useSession();
  
  // Component state
  const [followers, setFollowers] = useState(initialFollowers);
  const [isFollowed, setIsFollowed] = useState(initialFollowed);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch initial follow status and count
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (status !== "authenticated") {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/authors/${authorSlug}/follow`);
        const data = await response.json();

        if (data.data) {
          setFollowers(data.data.followers);
          setIsFollowed(data.data.followed);
        }
      } catch (error) {
        console.error("Error fetching follow status:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchFollowStatus();
  }, [authorSlug, status, initialFollowers]);

  // Function to handle following/unfollowing
  const handleFollowToggle = async () => {
    // Require authentication
    if (status !== "authenticated") {
      setShowLoginPrompt(true);
      return;
    }
    
    // Start animation
    setIsAnimating(true);
    
    // Optimistic update
    setIsFollowed(!isFollowed);
    setFollowers(prev => isFollowed ? Math.max(0, prev - 1) : prev + 1);
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/authors/${authorSlug}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setIsFollowed(isFollowed);
        setFollowers(prev => isFollowed ? prev + 1 : Math.max(0, prev - 1));
        throw new Error("Failed to update follow status");
      }

      const data = await response.json();
      // Update with actual server data
      if (data.data) {
        setIsFollowed(data.data.followed);
        setFollowers(data.data.followers);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
      // Keep animation running for a moment
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  // Format followers for display (e.g., 1000 -> 1K)
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Show skeleton loader while initial data is loading
  if (initialLoading) {
    return (
      <Button 
        size={size} 
        variant={variant}
        className={cn("relative", className)} 
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showCount && <span className="ml-2">...</span>}
      </Button>
    );
  }

  // Show login prompt if needed
  if (showLoginPrompt) {
    return (
      <div className="mt-2">
        <LoginPrompt
          title="Follow Authors"
          description="Sign in to follow this author and get updates on their new quotes."
          callToAction="Sign in"
          useModal={true}
          variant="inline"
          onClose={() => setShowLoginPrompt(false)}
          action="follow"
          targetId={authorSlug}
        />
      </div>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={cn(
        "relative", 
        isAnimating && "animate-pulse",
        isFollowed && "bg-primary/10 hover:bg-primary/20",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowed ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          <span>Follow</span>
        </>
      )}
      
      {showCount && followers > 0 && (
        <span className="ml-2 text-xs font-medium">
          {formatFollowers(followers)}
        </span>
      )}
    </Button>
  );
}