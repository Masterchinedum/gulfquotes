import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { UserQuoteList } from "@/components/users/user-quote-list";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { UserResponse } from "@/types/api/users";
// import type { Metadata } from "next";

export const metadata = {
  title: "Liked Quotes",
  description: "View quotes liked by this user"
};

interface LikesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LikesPage({
  params: paramsPromise,
}: LikesPageProps) {
  try {
    const params = await paramsPromise;
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    // Add includeLikes=true to fetch the liked quotes
    const res = await fetch(`${origin}/api/users/${params.slug}?includeLikes=true`, {
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

    // Get privacy settings and check if likes are visible
    const privacySettings = result.data.userProfile?.privacySettings;
    const showLikes = privacySettings?.showLikes !== false;
    const isCurrentUser = result.data.isCurrentUser;

    // If likes are not visible and not the current user, redirect or show a message
    if (!showLikes && !isCurrentUser) {
      return (
        <Shell>
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-4">Likes Not Public</h1>
              <p className="text-muted-foreground mb-6">
                This user has chosen to keep their likes private.
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

    const likes = result.data.userProfile?.likes || [];

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-500" />
                Liked Quotes
              </h1>
              <p className="text-muted-foreground mt-1">
                {isCurrentUser
                  ? "Quotes you've liked"
                  : `Quotes ${result.data.name || "this user"} has liked`}
              </p>
            </div>
          </div>

          <UserQuoteList
            quotes={likes}
            title="Liked Quotes"
            emptyMessage={
              isCurrentUser
                ? "You haven't liked any quotes yet."
                : "This user hasn't liked any quotes yet."
            }
            displayMode="expanded"
            actionButtons={false}
            renderEmptyState={() => (
              <div className="mt-4">
                <Link href="/quotes">
                  <Button variant="outline" size="sm">Browse Quotes</Button>
                </Link>
              </div>
            )}
          />
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[LIKES_PAGE]", error);
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">
            Failed to load likes. Please try again later.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Try again
          </Button>
        </div>
      </Shell>
    );
  }
}