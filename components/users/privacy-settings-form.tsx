"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import type { UserData, ProfilePrivacySettings } from "@/types/api/users";
import { useRouter } from "next/navigation";

interface PrivacySettingsFormProps {
  user: UserData;
}

export function PrivacySettingsForm({ user }: PrivacySettingsFormProps) {
  const router = useRouter();
  // Get default privacy settings or use defaults
  const defaultSettings = user.userProfile?.privacySettings || {
    showLikes: true,
    showBookmarks: false,
    showFollowing: true,
    showActivity: true,
  };

  const [settings, setSettings] = useState<ProfilePrivacySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Handle changes to privacy settings
  const handleToggle = (setting: keyof ProfilePrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  // Save privacy settings
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/privacy-settings", { // Change the endpoint
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to update privacy settings");
      }

      toast.success("Privacy settings updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update privacy settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <LockIcon className="h-5 w-5 text-primary" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control what information is visible to other users
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Likes Visibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-4 w-4 text-primary" />
                <Label htmlFor="show-likes" className="text-base font-medium">
                  Show Likes Publicly
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow others to see which quotes you&apos;ve liked
              </p>
            </div>
            <Switch
              id="show-likes"
              checked={settings.showLikes}
              onCheckedChange={() => handleToggle("showLikes")}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        {/* Bookmarks Visibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <EyeOffIcon className="h-4 w-4 text-primary" />
                <Label htmlFor="show-bookmarks" className="text-base font-medium">
                  Show Bookmarks Publicly
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow others to see which quotes you&apos;ve bookmarked
              </p>
            </div>
            <Switch
              id="show-bookmarks"
              checked={settings.showBookmarks}
              onCheckedChange={() => handleToggle("showBookmarks")}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        {/* Following List Visibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-4 w-4 text-primary" />
                <Label htmlFor="show-following" className="text-base font-medium">
                  Show Following List
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow others to see which authors you follow
              </p>
            </div>
            <Switch
              id="show-following"
              checked={settings.showFollowing}
              onCheckedChange={() => handleToggle("showFollowing")}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        {/* Activity Feed Visibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-4 w-4 text-primary" />
                <Label htmlFor="show-activity" className="text-base font-medium">
                  Show Activity Feed
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow others to see your recent activity (likes, comments, follows)
              </p>
            </div>
            <Switch
              id="show-activity"
              checked={settings.showActivity}
              onCheckedChange={() => handleToggle("showActivity")}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}