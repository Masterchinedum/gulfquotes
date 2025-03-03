// components/notifications/NotificationDropdown.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "./NotificationBadge";
import { NotificationItem } from "./NotificationItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationContext } from "@/contexts/notification-context";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    recentNotifications,
    unreadCount,
    isLoading,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationContext();

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen, fetchRecentNotifications]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-muted-foreground hover:text-foreground" 
          aria-label="Open notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <NotificationBadge count={unreadCount} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => markAllAsRead()}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentNotifications.length > 0 ? (
            recentNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>No notifications yet</p>
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <Link href="/notifications" className="block w-full">
          <DropdownMenuItem className="cursor-pointer w-full text-center">
            View all notifications
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}