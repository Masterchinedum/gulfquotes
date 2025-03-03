// components/notifications/NotificationDropdown.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
import { NotificationType } from "@prisma/client";
import { useRouter } from "next/navigation";

// Define the notification interface
interface Notification {
  id: string;
  type: NotificationType;
  title?: string | null;
  message: string;
  read: boolean;
  createdAt: Date;
  userId: string;
  quoteId?: string | null;
  authorProfileId?: string | null;
  actorId?: string | null;
  actor?: {
    id: string;
    name?: string | null;
    image?: string | null;
  } | null;
  quote?: {
    id: string;
    slug: string;
    content: string;
  } | null;
  authorProfile?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface NotificationResponse {
  data?: {
    items: Notification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=5');
      const data: NotificationResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      if (data.data) {
        setNotifications(data.data.items);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update the local state
      setNotifications(prev => 
        prev.map(item => 
          item.id === id ? { ...item, read: true } : item
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      router.refresh(); // Refresh the page to update any server components
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update the local state
      setNotifications(prev => 
        prev.map(item => ({ ...item, read: true }))
      );
      
      setUnreadCount(0);
      toast.success("All notifications marked as read");
      router.refresh(); // Refresh the page to update any server components
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  // Delete a notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Update the local state
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(item => item.id !== id));
      
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      router.refresh(); // Refresh the page to update any server components
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on initial load
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications?includeRead=false&limit=1');
        const data: NotificationResponse = await response.json();
        
        if (data.data) {
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
  }, []);

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
              onClick={markAllAsRead}
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
          ) : notifications.length > 0 ? (
            notifications.map(notification => (
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