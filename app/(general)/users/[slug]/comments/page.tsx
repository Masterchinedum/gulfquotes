import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { UserComments } from "@/components/users/user-comments";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReloadButton } from "@/components/reload-button";
import type { ApiResponse } from "@/types/api/author-profiles";
import type { ProfileComment } from "@/types/api/users";

// Create a type alias for the response type we need
type CommentPaginatedResponse = ApiResponse<{
  items: ProfileComment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}>;

interface CommentsPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ 
    page?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function CommentsPage({
  params: paramsPromise,
  searchParams: searchParamsPromise = Promise.resolve({ page: "1" })
}: CommentsPageProps) {
  try {
    // Resolve both promises
    const [params, searchParams] = await Promise.all([
      paramsPromise,
      searchParamsPromise
    ]);
    
    const page = Number(searchParams?.page) || 1;
    const limit = 12; // Show 12 comments per page
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    const res = await fetch(
      `${origin}/api/users/${params.slug}/comments?page=${page}&limit=${limit}`,
      {
        headers: {
          cookie: headersList.get("cookie") || "",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch comments: ${res.status}`);
    }

    const result: CommentPaginatedResponse = await res.json();
    
    if (!result.data) {
      throw new Error("No data returned from API");
    }

    const { items: comments, total } = result.data;
    const totalPages = Math.ceil(total / limit);

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
                Your comments on quotes
              </p>
            </div>
          </div>

          {comments.length > 0 ? (
            <div className="space-y-8">
              <UserComments 
                comments={comments}
                isCurrentUser={true}
              />
              
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {page > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/comments?page=${page - 1}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {page < totalPages && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/comments?page=${page + 1}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No comments found.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/quotes">Browse Quotes</Link>
              </Button>
            </div>
          )}
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
            Failed to load comments. Please try again later.
          </p>
          <ReloadButton />
        </div>
      </Shell>
    );
  }
}