import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchUserProfile } from "@/actions/user-profile";
import { ProfileEditForm } from "@/components/users/profile-edit-form";
import { Shell } from "@/components/shells/shell";
import { ErrorBoundary } from "@/components/users/error-boundary";
import { LoadingSkeleton } from "@/components/users/loading";
import type { UserResponse } from "@/types/api/users";

export default async function SettingsPage() {
  // Check for an authenticated session
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id as string;

  try {
    // Fetch the current user's profile data
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
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <Suspense fallback={<LoadingSkeleton />}>
              <ProfileEditForm user={result.data} />
            </Suspense>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[SETTINGS_PAGE]", error);
    return (
      <Shell>
        <ErrorBoundary error={error} reset={() => window.location.reload()} />
      </Shell>
    );
  }
}