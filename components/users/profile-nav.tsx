"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserData } from "@/types/api/users";
import { 
  Heart, 
  Bookmark, 
  Users, 
  MessageSquare, 
  Settings,
  Clock
} from "lucide-react";

interface ProfileNavProps {
  user: UserData;
  variant?: "desktop" | "mobile";
  className?: string;
}

export function ProfileNav({ 
  user, 
  variant = "desktop",
  className 
}: ProfileNavProps) {
  const pathname = usePathname();
  const isCurrentUser = user.isCurrentUser;
  const slug = user.userProfile?.slug || user.id;
  
  // Define navigation items - some are only visible to the profile owner
  const navItems = [
    {
      name: "Overview",
      href: `/users/${slug}`,
      icon: Clock,
      show: true,
    },
    {
      name: "Likes",
      href: `/users/${slug}/likes`,
      icon: Heart,
      show: true,
    },
    {
      name: "Bookmarks",
      href: `/users/${slug}/bookmarks`,
      icon: Bookmark,
      show: isCurrentUser,
    },
    {
      name: "Following",
      href: `/users/${slug}/following`,
      icon: Users,
      show: true,
    },
    {
      name: "Comments",
      href: `/users/${slug}/comments`,
      icon: MessageSquare,
      show: true,
    },
    {
      name: "Settings",
      href: "/users/settings",
      icon: Settings,
      show: isCurrentUser,
    },
  ].filter(item => item.show);

  if (variant === "mobile") {
    return (
      <div className={cn("flex overflow-x-auto scrollbar-hide py-2 border-b", className)}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (pathname.startsWith(item.href) && item.href !== `/users/${slug}`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap",
                isActive 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground transition-colors"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (pathname.startsWith(item.href) && item.href !== `/users/${slug}`);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
              isActive 
                ? "bg-muted font-medium text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}