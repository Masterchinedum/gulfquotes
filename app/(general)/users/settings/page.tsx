import React, { Suspense } from "react";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchUserProfile } from "@/actions/user-profile";
import { ProfileEditForm } from "@/components/users/profile-edit-form";
import { PrivacySettingsForm } from "@/components/users/privacy-settings-form";
import { NotificationSettingsForm } from "@/components/users/notification-settings-form";
import { Shell } from "@/components/shells/shell";
import { ErrorBoundary } from "@/components/users/error-boundary";
import { LoadingSkeleton } from "@/components/users/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCircle, User, Bell, Activity } from "lucide-react"; // Changed UserImage to UserCircle
import type { UserResponse } from "@/types/api/users";

export const metadata: Metadata = {
  title: "Settings | gulfquotes",
  description: "Manage your profile and account settings",
};

function isErrorWithMessage(error: unknown): error is { code?: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

function ActivitySummary({ user }: { user: NonNullable<UserResponse['data']> }) {
  const stats = user.userProfile?.activityStats;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Account Activity
        </CardTitle>
        <CardDescription>Overview of your account activity</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats?.likeCount || 0}</div>
            <div className="text-sm text-muted-foreground">Liked Quotes</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats?.bookmarkCount || 0}</div>
            <div className="text-sm text-muted-foreground">Bookmarked Quotes</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats?.commentCount || 0}</div>
            <div className="text-sm text-muted-foreground">Comments Made</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats?.followingCount || 0}</div>
            <div className="text-sm text-muted-foreground">Authors Followed</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Member since: {new Date(stats?.memberSince || Date.now()).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage() {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Ensure session.user.id is a string
  if (typeof session.user.id !== "string") {
    throw new Error("Invalid user ID");
  }

  // Get user data - using fetchUserProfile instead of getUserProfile
  const userResponse = await fetchUserProfile(session.user.id);
  if (!userResponse.data) {
    throw new Error("Failed to load user data");
  }

  const userData = userResponse.data;

  try {
    return (
      <Shell>
        <div className="container py-10 max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your profile, privacy, and notification preferences
            </p>
          </div>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Privacy
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <ProfileEditForm user={userData} />
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-6">
              <PrivacySettingsForm user={userData} />
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettingsForm />
            </TabsContent>
          </Tabs>

          <Separator />

          <Suspense fallback={<LoadingSkeleton />}>
            <ActivitySummary user={userData} />
          </Suspense>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[SETTINGS_PAGE]", error);
    return (
      <Shell>
        <ErrorBoundary
          error={isErrorWithMessage(error) ? error : { message: "An unknown error occurred" }}
          reset={() => window.location.reload()}
        />
      </Shell>
    );
  }
}