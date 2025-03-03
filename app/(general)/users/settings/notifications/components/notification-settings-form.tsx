// app/(general)/users/settings/notifications/components/notification-settings-form.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { NotificationType } from "@prisma/client";

interface NotificationPreferences {
  emailNotifications: boolean;
  emailNotificationTypes: NotificationType[];
}



export function NotificationSettingsForm() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: false,
    emailNotificationTypes: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch current notification preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/users/notification-settings");
        if (!response.ok) {
          throw new Error("Failed to fetch notification settings");
        }
        const data = await response.json();
        if (data.data) {
          setPreferences({
            emailNotifications: data.data.emailNotifications,
            emailNotificationTypes: data.data.emailNotificationTypes || [],
          });
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        toast.error("Failed to load notification settings");
      } finally {
        setIsFetching(false);
      }
    }
    
    fetchPreferences();
  }, []);

  // Toggle main email notifications switch
  const handleEmailToggle = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      emailNotifications: enabled
    }));
  };

  // Toggle individual notification type
  const handleTypeToggle = (type: NotificationType, checked: boolean) => {
    setPreferences(prev => {
      if (checked) {
        // Add the type if it's not already in the array
        return {
          ...prev,
          emailNotificationTypes: [...prev.emailNotificationTypes, type]
        };
      } else {
        // Remove the type from the array
        return {
          ...prev,
          emailNotificationTypes: prev.emailNotificationTypes.filter(t => t !== type)
        };
      }
    });
  };

  // Save notification preferences
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save notification settings");
      }

      toast.success("Notification settings saved successfully");
      router.refresh();
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading your notification settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Icons.spinner className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notification Settings</CardTitle>
        <CardDescription>
          Control which notifications you receive via email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications about important updates
            </p>
          </div>
          <Switch 
            id="email-notifications" 
            checked={preferences.emailNotifications}
            onCheckedChange={handleEmailToggle}
            disabled={isLoading}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notification Types</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="notification-new-quote" 
                checked={preferences.emailNotificationTypes.includes(NotificationType.NEW_QUOTE)}
                onCheckedChange={(checked) => 
                  handleTypeToggle(NotificationType.NEW_QUOTE, checked as boolean)
                }
                disabled={!preferences.emailNotifications || isLoading}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="notification-new-quote">New Quotes</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when authors you follow post new quotes
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="notification-comment" 
                checked={preferences.emailNotificationTypes.includes(NotificationType.COMMENT)}
                onCheckedChange={(checked) => 
                  handleTypeToggle(NotificationType.COMMENT, checked as boolean)
                }
                disabled={!preferences.emailNotifications || isLoading}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="notification-comment">Comments</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when someone comments on your quotes
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="notification-like" 
                checked={preferences.emailNotificationTypes.includes(NotificationType.LIKE)}
                onCheckedChange={(checked) => 
                  handleTypeToggle(NotificationType.LIKE, checked as boolean)
                }
                disabled={!preferences.emailNotifications || isLoading}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="notification-like">Likes</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when someone likes your quotes
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="notification-follow" 
                checked={preferences.emailNotificationTypes.includes(NotificationType.FOLLOW)}
                onCheckedChange={(checked) => 
                  handleTypeToggle(NotificationType.FOLLOW, checked as boolean)
                }
                disabled={!preferences.emailNotifications || isLoading}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="notification-follow">Follows</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when someone follows you
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="notification-system" 
                checked={preferences.emailNotificationTypes.includes(NotificationType.SYSTEM)}
                onCheckedChange={(checked) => 
                  handleTypeToggle(NotificationType.SYSTEM, checked as boolean)
                }
                disabled={!preferences.emailNotifications || isLoading}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="notification-system">System</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important system notifications and announcements
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}