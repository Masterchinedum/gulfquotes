// components/notifications/NotificationList.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Check } from "lucide-react";
import { useNotificationContext } from "@/contexts/notification-context";
import { Card } from "@/components/ui/card";
import { NotificationPagination } from "./NotificationPagination"; // Add this import

interface NotificationListProps {
  initialPage?: number;
  initialLimit?: number;
  initialReadFilter?: string;
}

export function NotificationList({ 
  initialPage = 1, 
  initialLimit = 10,
  initialReadFilter
}: NotificationListProps) {
  const router = useRouter();
  const tabValue = initialReadFilter === "unread" ? "unread" : 
                 initialReadFilter === "read" ? "read" : "all";
  
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [readFilter, setReadFilter] = useState<string | undefined>(initialReadFilter);
  
  const { 
    notifications, 
    isLoading, 
    totalCount: total,
    unreadCount,
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    fetchNotifications
  } = useNotificationContext();
  
  // Fetch notifications when params change
  useEffect(() => {
    const onlyRead = readFilter === "read";
    const includeRead = readFilter !== "unread";
    
    // Pass the filter parameters to fetchNotifications
    fetchNotifications(page, limit, includeRead, onlyRead);
  }, [page, limit, readFilter, fetchNotifications]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (limit !== 10) params.set("limit", limit.toString());
    if (readFilter) params.set("read", readFilter);
    
    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : "/notifications";
    
    router.push(url, { scroll: false });
  }, [page, limit, readFilter, router]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setPage(1); // Reset to first page on filter change
    if (value === "all") {
      setReadFilter(undefined);
    } else {
      setReadFilter(value);
    }
  };

  // Handle limit change
  const handleLimitChange = (value: string) => {
    setPage(1); // Reset to first page on limit change
    setLimit(Number(value));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Rest of the component remains the same */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue={tabValue} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark all as read
            </Button>
          )}
          
          <Select
            value={limit.toString()}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className="overflow-hidden">
              <NotificationItem
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No notifications found</p>
        </Card>
      )}
      
      {total > 0 && (
        <div className="flex justify-center mt-6">
          <NotificationPagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}