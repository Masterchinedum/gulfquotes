import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { QuoteGrid } from "@/app/(general)/quotes/components/quote-grid";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { QuotePaginatedResponse } from "@/types/api/quotes";
import { ReloadButton } from "@/components/reload-button";

interface BookmarksPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ 
    page?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function BookmarksPage({
  params: paramsPromise,
  searchParams: searchParamsPromise = Promise.resolve({ page: "1" })
}: BookmarksPageProps) {
  try {
    // Resolve both promises
    const [params, searchParams] = await Promise.all([
      paramsPromise,
      searchParamsPromise
    ]);
    
    const page = Number(searchParams?.page) || 1;
    const limit = 9; // Limit to 9 quotes per page
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    const res = await fetch(
      `${origin}/api/users/${params.slug}/bookmarks?page=${page}&limit=${limit}`,
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
      throw new Error(`Failed to fetch bookmarks: ${res.status}`);
    }

    const result: QuotePaginatedResponse = await res.json();
    
    if (result.error?.code === "FORBIDDEN") {
      return (
        <Shell>
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-4">Private Collection</h1>
              <p className="text-muted-foreground mb-6">
                Bookmarked quotes are private and can only be viewed by their owner.
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

    const { items: quotes, total } = result.data;
    const totalPages = Math.ceil(total / limit);

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bookmark className="h-6 w-6 text-primary" />
                Bookmarked Quotes
              </h1>
            </div>
          </div>

          {quotes.length > 0 ? (
            <div className="space-y-8">
              <QuoteGrid 
                quotes={quotes.map(quote => ({
                  id: quote.id,
                  slug: quote.slug,
                  content: quote.content,
                  backgroundImage: quote.backgroundImage ?? null,
                  author: {
                    name: quote.authorProfile.name,
                    image: quote.authorProfile.image ?? null,
                    slug: quote.authorProfile.slug
                  },
                  category: {
                    name: quote.category.name,
                    slug: quote.category.slug
                  }
                }))}
              />
              
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {page > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/bookmarks?page=${page - 1}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {page < totalPages && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/bookmarks?page=${page + 1}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No bookmarked quotes found.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/quotes">Browse Quotes</Link>
              </Button>
            </div>
          )}
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[BOOKMARKS_PAGE]", error);
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">
            Failed to load bookmarked quotes. Please try again later.
          </p>
          <ReloadButton />
        </div>
      </Shell>
    );
  }
}