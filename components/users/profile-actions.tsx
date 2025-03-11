"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MoreHorizontal,
//   Bookmark,
  Share2,
  Flag,
  Copy,
  Ban,
} from "lucide-react";
import type { UserData } from "@/types/api/users";
import { useSession } from "next-auth/react";

interface ProfileActionsProps {
  user: UserData;
  className?: string;
}

export function ProfileActions({ user, className }: ProfileActionsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isOwnProfile = session?.user?.id === user.id;
  const canModerate = isAdmin && !isOwnProfile;

  // Share profile
  const handleShare = async () => {
    const url = `${window.location.origin}/users/${user.userProfile?.slug || user.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user.name}'s Profile - gulfquotes`,
          text: `Check out ${user.name}'s profile on gulfquotes`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard");
      }
    } catch (error) {
      // Ignore user cancellation
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing profile:", error);
        toast.error("Failed to share profile");
      }
    }
  };

  // Report profile
  const handleReport = async () => {
    if (isReporting) return;

    try {
      setIsReporting(true);
      
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "USER",
          targetId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      toast.success("Report submitted successfully");
    } catch (error) {
      console.error("Error reporting profile:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsReporting(false);
    }
  };

  // Block user (Admin only)
  const handleBlock = async () => {
    if (!canModerate || isBlocking) return;

    try {
      setIsBlocking(true);
      
      const response = await fetch(`/api/users/${user.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to block user");
      }

      toast.success("User blocked successfully");
      router.refresh();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    } finally {
      setIsBlocking(false);
    }
  };

  if (isOwnProfile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Profile link copied to clipboard");
        }}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleReport}
          disabled={isReporting}
          className="text-destructive"
        >
          <Flag className="h-4 w-4 mr-2" />
          Report Profile
        </DropdownMenuItem>

        {canModerate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleBlock}
              disabled={isBlocking}
              className="text-destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}