import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchUserProfile } from "@/actions/user-profile";
import { ProfileEditForm } from "@/components/users/profile-edit-form";
import { PrivacySettingsForm } from "@/components/users/privacy-settings-form";
import { Shell } from "@/components/shells/shell";
import { ErrorBoundary } from "@/components/users/error-boundary";
import { LoadingSkeleton } from "@/components/users/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCircle, Shield, Activity } from "lucide-react";
import type { UserResponse } from "@/types/api/users";

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
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id as string;

  try {
    const result: UserResponse = await fetchUserProfile(userId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      throw new Error("User data not found");
    }

    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-3xl space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Suspense fallback={<LoadingSkeleton />}>
                  <ProfileEditForm user={result.data} />
                </Suspense>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <Suspense fallback={<LoadingSkeleton />}>
                  <PrivacySettingsForm user={result.data} />
                </Suspense>
              </TabsContent>
            </Tabs>

            <Separator />

            <Suspense fallback={<LoadingSkeleton />}>
              <ActivitySummary user={result.data} />
            </Suspense>
          </div>
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