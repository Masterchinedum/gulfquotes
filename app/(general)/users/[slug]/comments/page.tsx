import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { UserComments } from "@/components/users/user-comments";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReloadButton } from "@/components/reload-button";
import type { UserResponse } from "@/types/api/users";
// import type { Metadata } from "next";

export const metadata = {
  title: "User Comments",
  description: "View comments made by this user"
};

interface CommentsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommentsPage({
  params: paramsPromise,
}: CommentsPageProps) {
  try {
    const params = await paramsPromise;
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    const res = await fetch(`${origin}/api/users/${params.slug}?includeComments=true`, {
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

    const comments = result.data.userProfile?.comments || [];
    const isCurrentUser = result.data.isCurrentUser;

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Comments
              </h1>
              <p className="text-muted-foreground mt-1">
                {isCurrentUser
                  ? "Comments you've made on quotes"
                  : `Comments by ${result.data.name || "this user"}`}
              </p>
            </div>
          </div>

          <UserComments
            comments={comments}
            isCurrentUser={!!isCurrentUser}
            emptyMessage={
              isCurrentUser
                ? "You haven't commented on any quotes yet."
                : "This user hasn't commented on any quotes yet."
            }
            renderEmptyAction={isCurrentUser ? (
              <div className="mt-4">
                <Link href="/quotes">
                  <Button variant="outline" size="sm">Browse Quotes</Button>
                </Link>
              </div>
            ) : undefined}
          />
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[COMMENTS_PAGE]", error);
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