// components/home/QuickActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BookMarked, Sparkles, Library } from "lucide-react";
import { useSession } from "next-auth/react";
import { LoginButton } from "@/components/auth/login-button";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const router = useRouter();
  const { status, data: session } = useSession(); // Get session data

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {/* Start Collection Button - Updated to go to bookmarks */}
      {status === "authenticated" ? (
        <Button 
          size="lg" 
          className={cn(
            "text-base font-medium",
            "flex items-center gap-2"
          )}
          onClick={() => router.push(`/users/${session?.user?.id}/bookmarks`)}
        >
          <BookMarked className="h-5 w-5" />
          Your Collection
        </Button>
      ) : (
        <LoginButton mode="modal">
          <Button 
            size="lg" 
            className={cn(
              "text-base font-medium",
              "flex items-center gap-2"
            )}
          >
            <BookMarked className="h-5 w-5" />
            Start Collection
          </Button>
        </LoginButton>
      )}

      {/* Browse Quotes Button */}
      <Button 
        size="lg" 
        variant="secondary" 
        className={cn(
          "text-base font-medium",
          "flex items-center gap-2"
        )}
        onClick={() => router.push("/quotes")}
      >
        <Library className="h-5 w-5" />
        Browse Quotes
      </Button>

      {/* Daily Quote Button */}
      <Button 
        size="lg" 
        variant="outline" 
        className={cn(
          "text-base font-medium",
          "flex items-center gap-2",
          "border-2"
        )}
        onClick={() => router.push("/daily")}
      >
        <Sparkles className="h-5 w-5" />
        Daily Quote
      </Button>
    </div>
  );
}