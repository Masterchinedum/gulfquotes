// hooks/useNotifications.ts
import { useEffect } from 'react';
import { NotificationType } from '@prisma/client';
import { useNotificationContext } from '@/contexts/notification-context';

// Export the interface for use elsewhere
export interface NotificationData {
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

/**
 * @deprecated Use useNotificationContext from @/contexts/notification-context directly.
 * This hook is maintained for backward compatibility.
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  // Extract only the properties we actually use
  const {
    page = 1,
    limit = 10,
    pollInterval = 120000, // 2 minutes
    autoRefetch = true
  } = options;
  
  const context = useNotificationContext();
  
  // Initial fetch
  useEffect(() => {
    if (autoRefetch) {
      context.fetchNotifications(page, limit);
    }
  }, [context, page, limit, autoRefetch]);

  // Setup polling for real-time updates if enabled
  useEffect(() => {
    if (pollInterval <= 0) return;
    
    const intervalId = setInterval(() => {
      context.fetchNotifications(page, limit);
    }, pollInterval);
    
    return () => clearInterval(intervalId);
  }, [context, page, limit, pollInterval]);

  return {
    notifications: context.notifications,
    isLoading: context.isLoading,
    error: context.error,
    total: context.totalCount,
    unreadCount: context.unreadCount,
    refetch: () => context.fetchNotifications(page, limit),
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    deleteNotification: context.deleteNotification
  };
}