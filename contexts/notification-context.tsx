// contexts/notification-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NotificationType } from '@prisma/client';

// Define types for notifications
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

interface NotificationsResponse {
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

interface NotificationContextType {
  notifications: Notification[];
  recentNotifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, limit?: number, includeRead?: boolean, onlyRead?: boolean) => Promise<void>; // Updated to accept parameters
  fetchRecentNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
}

// Create the context with a default value
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState(0);

  // Fetch all notifications (paginated)
  const fetchNotifications = useCallback(async (
    page = 1, 
    limit = 20,
    includeRead = true,
    onlyRead = false
  ) => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session?.user) {
      return;
    }
    
    // Rate limiting - don't refetch if we just did (within last 5 seconds)
    const now = Date.now();
    if (now - lastFetched < 5000) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setLastFetched(now);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeRead: includeRead.toString()
      });
      
      // Add onlyRead parameter if true
      if (onlyRead) {
        params.set('onlyRead', 'true');
      }
      
      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch notifications');
      }
      
      const data: NotificationsResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      if (data.data) {
        setNotifications(data.data.items);
        setTotalCount(data.data.total);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session, status, lastFetched]);
  
  // Fetch only recent notifications (for dropdown)
  const fetchRecentNotifications = useCallback(async () => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session?.user) {
      return;
    }
    
    try {
      const params = new URLSearchParams({
        limit: '5'
      });
      
      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        return; // Silently fail for recent notifications
      }
      
      const data: NotificationsResponse = await response.json();
      
      if (data.data) {
        setRecentNotifications(data.data.items);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching recent notifications:', err);
    }
  }, [session, status]);
  
  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session?.user) {
      return;
    }
    
    try {
      const params = new URLSearchParams({
        includeRead: 'false',
        limit: '1'
      });
      
      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        return; // Silently fail for unread count
      }
      
      const data: NotificationsResponse = await response.json();
      
      if (data.data) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [session, status]);

  // Mark a notification as read
  const markAsRead = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to mark notification as read');
      }
      
      // Update both notification lists
      setNotifications(prev => 
        prev.map(item => item.id === id ? { ...item, read: true } : item)
      );
      
      setRecentNotifications(prev => 
        prev.map(item => item.id === id ? { ...item, read: true } : item)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      router.refresh();
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark notification as read');
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to mark all notifications as read');
      }
      
      // Update both notification lists
      setNotifications(prev => 
        prev.map(item => ({ ...item, read: true }))
      );
      
      setRecentNotifications(prev => 
        prev.map(item => ({ ...item, read: true }))
      );
      
      setUnreadCount(0);
      toast.success("All notifications marked as read");
      router.refresh();
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
      return false;
    }
  };

  // Delete a notification
  const deleteNotification = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete notification');
      }
      
      // Find the notification to check if it was unread
      const deletedFromMain = notifications.find(n => n.id === id);
      const deletedFromRecent = recentNotifications.find(n => n.id === id);
      
      // Update both notification lists
      setNotifications(prev => prev.filter(item => item.id !== id));
      setRecentNotifications(prev => prev.filter(item => item.id !== id));
      
      // Update counts
      if ((deletedFromMain && !deletedFromMain.read) || (deletedFromRecent && !deletedFromRecent.read)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setTotalCount(prev => Math.max(0, prev - 1));
      toast.success("Notification deleted");
      router.refresh();
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete notification');
      return false;
    }
  };

  // Initial fetch when session becomes available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount, session, status]);

  // Set up polling for unread count (every 2 minutes)
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }
    
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 120000); // 2 minutes
    
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount, session, status]);

  // The context value
  const contextValue: NotificationContextType = {
    notifications,
    recentNotifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    fetchNotifications,
    fetchRecentNotifications, // Add this line
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
}