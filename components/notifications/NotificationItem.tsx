// components/notifications/NotificationItem.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, Quote, Trash2, User } from "lucide-react";
import { NotificationType } from "@prisma/client";
import Link from "next/link";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
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
  };
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({ 
  notification, 
  onRead, 
  onDelete 
}: NotificationItemProps) {
  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onRead) {
      try {
        onRead(notification.id);
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDelete) {
      try {
        onDelete(notification.id);
        toast.success("Notification deleted");
      } catch (error) {
        console.error("Error deleting notification:", error);
        toast.error("Failed to delete notification");
      }
    }
  };

  // Determine the link destination based on the notification type
  const getNotificationLink = () => {
    switch(notification.type) {
      case NotificationType.NEW_QUOTE:
        return notification.quote ? `/quotes/${notification.quote.slug}` : "#";
      case NotificationType.FOLLOW:
        return notification.authorProfile ? `/authors/${notification.authorProfile.slug}` : "#";
      default:
        return "#";
    }
  };
  
  // Get the appropriate icon for the notification type
  const getNotificationIcon = () => {
    switch(notification.type) {
      case NotificationType.NEW_QUOTE:
        return <Quote className="h-4 w-4" />;
      case NotificationType.FOLLOW:
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <Link href={getNotificationLink()}>
      <div 
        className={cn(
          "flex items-start p-3 gap-2 hover:bg-accent rounded-md transition-colors cursor-pointer",
          !notification.read && "bg-accent/40"
        )}
      >
        {/* Actor avatar or fallback icon */}
        <Avatar className="h-8 w-8">
          {notification.actor?.image ? (
            <AvatarImage src={notification.actor.image} alt={notification.actor.name || ""} />
          ) : (
            <AvatarFallback>
              {getNotificationIcon()}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Notification content */}
        <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
          {notification.title && (
            <p className="font-medium text-sm">{notification.title}</p>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1 self-start ml-2">
          {!notification.read && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handleMarkAsRead}
              title="Mark as read"
            >
              <Check className="h-3 w-3" />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" 
            onClick={handleDelete}
            title="Delete notification"
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete notification</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}