// components/shared/QuoteCommentButton.tsx
"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface QuoteCommentButtonProps {
  quoteSlug: string;
  commentCount: number;
  className?: string;
}

export function QuoteCommentButton({
  quoteSlug,
  commentCount = 0,
  className,
}: QuoteCommentButtonProps) {
  const router = useRouter();

  // Format comment count for display
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Navigate to quote detail page with focus on comments
  const handleClick = () => {
    try {
      router.push(`/quotes/${quoteSlug}#comments`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Could not navigate to comments section");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      className={cn("hover:bg-transparent", className)}
      onClick={handleClick}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {formatCount(commentCount)}
    </Button>
  );
}