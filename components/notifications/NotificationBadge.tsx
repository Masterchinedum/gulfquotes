// components/notifications/NotificationBadge.tsx
"use client";

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  size?: "sm" | "md";
}

export function NotificationBadge({ 
  count, 
  className,
  size = "sm" 
}: NotificationBadgeProps) {
  if (count <= 0) return null;
  
  return (
    <span 
      className={cn(
        "absolute flex items-center justify-center",
        "rounded-full bg-destructive text-destructive-foreground",
        "font-medium",
        size === "sm" ? (
          "h-4 w-4 text-[10px] -right-1 -top-1"
        ) : (
          "h-5 w-5 text-xs -right-1.5 -top-1"
        ),
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}