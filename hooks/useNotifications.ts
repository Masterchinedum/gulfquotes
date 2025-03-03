// hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { NotificationType } from '@prisma/client';

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

interface UseNotificationsOptions {
  page?: number;
  limit?: number;
  includeRead?: boolean;
  onlyRead?: boolean;
  pollInterval?: number; // Polling interval in ms, set to 0 to disable
  autoRefetch?: boolean; // Whether to auto-refetch on mount
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

export function useNotifications({
  page = 1,
  limit = 10,
  includeRead = true,
  onlyRead = false,
  pollInterval = 30000, // Default polling every 30 seconds
  autoRefetch = true
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Construct the query parameters
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    if (onlyRead) {
      params.set('includeRead', 'true');
      params.set('onlyRead', 'true');
    } else if (!includeRead) {
      params.set('includeRead', 'false');
    }
    
    return params.toString();
  }, [page, limit, includeRead, onlyRead]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = getQueryParams();
      const response = await fetch(`/api/notifications?${queryParams}`);
      
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
        setTotal(data.data.total);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getQueryParams]);

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(item => 
          item.id === id ? { ...item, read: true } : item
        )
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
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
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
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete notification');
      }
      
      // Update local state
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(item => item.id !== id));
      
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setTotal(prev => Math.max(0, prev - 1));
      toast.success("Notification deleted");
      router.refresh();
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete notification');
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (autoRefetch) {
      fetchNotifications();
    }
  }, [fetchNotifications, autoRefetch]);

  // Setup polling for real-time updates if enabled
  useEffect(() => {
    if (pollInterval <= 0) return;
    
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, pollInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchNotifications, pollInterval]);

  return {
    notifications,
    isLoading,
    error,
    total,
    unreadCount,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}