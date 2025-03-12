import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { FollowedAuthors } from "@/components/users/followed-authors";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { UserResponse } from "@/types/api/users";
import { ReloadButton } from "@/components/reload-button";
// import type { Metadata } from "next";

export const metadata = {
  title: "Following",
  description: "View authors this user is following"
};

interface FollowingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function FollowingPage({
  params: paramsPromise,
}: FollowingPageProps) {
  try {
    const params = await paramsPromise;
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    const res = await fetch(`${origin}/api/users/${params.slug}?includeFollowedAuthors=true`, {
      headers: {
        cookie: headersList.get("cookie") || "",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch user data: ${res.status}`);
    }

    const result: UserResponse = await res.json();
    
    if (!result.data) {
      notFound();
    }

    // Get privacy settings and check if following list is visible
    const privacySettings = result.data.userProfile?.privacySettings;
    const showFollowing = privacySettings?.showFollowing !== false;
    const isCurrentUser = result.data.isCurrentUser;

    // If following list is not visible and not the current user, show a message
    if (!showFollowing && !isCurrentUser) {
      return (
        <Shell>
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-4">Following List Not Public</h1>
              <p className="text-muted-foreground mb-6">
                This user has chosen to keep their following list private.
              </p>
              <Button asChild variant="outline">
                <Link href={`/users/${params.slug}`}>
                  Return to Profile
                </Link>
              </Button>
            </div>
          </div>
        </Shell>
      );
    }

    const followedAuthors = result.data.userProfile?.followedAuthors || [];

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Following
              </h1>
              <p className="text-muted-foreground mt-1">
                {isCurrentUser
                  ? "Authors you're following"
                  : `Authors ${result.data.name || "this user"} is following`}
              </p>
            </div>
          </div>

          <FollowedAuthors
            authors={followedAuthors}
            isCurrentUser={!!isCurrentUser}
            emptyMessage={
              isCurrentUser
                ? "You're not following any authors yet."
                : "This user isn't following any authors yet."
            }
            layout="list"
            showFollowButton={true}
          />
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[FOLLOWING_PAGE]", error);
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">
            Failed to load bookmarks. Please try again later.
          </p>
          <ReloadButton />
        </div>
      </Shell>
    );
  }
}