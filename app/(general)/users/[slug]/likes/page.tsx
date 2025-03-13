import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { QuoteGrid } from "@/app/(general)/quotes/components/quote-grid";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { QuotePaginatedResponse } from "@/types/api/quotes";
import { ReloadButton } from "@/components/reload-button";

// Update interface to match Next.js 15 requirements
interface LikesPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ 
    page?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function LikesPage({
  params: paramsPromise,
  searchParams: searchParamsPromise
}: LikesPageProps) {
  try {
    // Resolve both promises
    const [params, searchParams] = await Promise.all([
      paramsPromise,
      searchParamsPromise || Promise.resolve({})
    ]);
    
    const page = Number(searchParams?.page) || 1;
    const headersList = headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    const res = await fetch(
      `${origin}/api/users/${params.slug}/likes?page=${page}`,
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
      throw new Error(`Failed to fetch likes: ${res.status}`);
    }

    const result: QuotePaginatedResponse = await res.json();
    
    if (result.error?.code === "FORBIDDEN") {
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

    const { items: quotes, hasMore } = result.data;

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-500" />
                Liked Quotes
              </h1>
            </div>
          </div>

          {quotes.length > 0 ? (
            <div className="space-y-8">
              <QuoteGrid quotes={quotes} />
              
              {(hasMore || page > 1) && (
                <div className="flex justify-center gap-2 pt-4">
                  {page > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/likes?page=${page - 1}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {hasMore && (
                    <Button variant="outline" asChild>
                      <Link href={`/users/${params.slug}/likes?page=${page + 1}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No liked quotes found.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/quotes">Browse Quotes</Link>
              </Button>
            </div>
          )}
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
            Failed to load liked quotes. Please try again later.
          </p>
          <ReloadButton />
        </div>
      </Shell>
    );
  }
}