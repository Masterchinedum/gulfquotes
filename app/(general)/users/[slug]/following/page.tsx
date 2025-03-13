import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { FollowedAuthors } from "@/components/users/followed-authors";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ApiResponse, PaginatedResponse } from "@/types/api/author-profiles";
import type { ProfileFollowedAuthor } from "@/types/api/users";
import { ReloadButton } from "@/components/reload-button";

// Create a type alias for the response type we need
type AuthorPaginatedResponse = ApiResponse<PaginatedResponse<ProfileFollowedAuthor>>;

interface FollowingPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ 
    page?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function FollowingPage({
  params: paramsPromise,
  searchParams: searchParamsPromise = Promise.resolve({ page: "1" })
}: FollowingPageProps) {
  try {
    // Resolve both promises
    const [params, searchParams] = await Promise.all([
      paramsPromise,
      searchParamsPromise
    ]);
    
    const page = Number(searchParams?.page) || 1;
    const limit = 12; // Show 12 authors per page
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    const res = await fetch(
      `${origin}/api/users/${params.slug}/following?page=${page}&limit=${limit}`,
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
      throw new Error(`Failed to fetch following: ${res.status}`);
    }

    const result: AuthorPaginatedResponse = await res.json();
    
    if (result.error?.code === "FORBIDDEN") {
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

    if (!result.data) {
      throw new Error("No data returned from API");
    }

    const { items: authors, total } = result.data;
    const totalPages = Math.ceil(total / limit);

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Following
              </h1>
            </div>
          </div>

          {authors.length > 0 ? (
            <div className="space-y-8">
              <FollowedAuthors 
                authors={authors}
                isCurrentUser={true}
                layout="list"
                showFollowButton={true}
              />
              
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {page > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/following?page=${page - 1}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {page < totalPages && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/following?page=${page + 1}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Not following any authors yet.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/authors">Browse Authors</Link>
              </Button>
            </div>
          )}
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
            Failed to load following list. Please try again later.
          </p>
          <ReloadButton />
        </div>
      </Shell>
    );
  }
}