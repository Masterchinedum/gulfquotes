//app/(general)/users/[slug]/bookmarks/page.tsx

import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { Shell } from "@/components/shells/shell";
import { BookmarkIcon } from "lucide-react";
import { quoteBookmarkService } from "@/lib/services/bookmark";
import { QuoteGrid } from "@/app/(general)/quotes/components/quote-grid";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import db from "@/lib/prisma";

export const metadata = {
  title: "Bookmarked Quotes",
  description: "View quotes bookmarked by this user"
};

interface BookmarkPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
  }>;
}

export default async function BookmarksPage({
  params,
  searchParams
}: BookmarkPageProps) {
  const session = await auth();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Get user info from slug
  const userProfile = await db.user.findUnique({
    where: { id: resolvedParams.slug },
    select: { 
      id: true,
      name: true,
      image: true
    }
  });

  if (!userProfile) {
    notFound();
  }
  
  // Check permissions - only allow users to see their own bookmarks
  const isOwnProfile = session?.user?.id === userProfile.id;
  if (!isOwnProfile) {
    redirect(`/users/${resolvedParams.slug}`);
  }

  const page = Number(resolvedSearchParams?.page) || 1;
  const slug = resolvedParams.slug;

  try {
    // Get bookmarked quotes
    const result = await quoteBookmarkService.getBookmarkedQuotes(
      userProfile.id,
      page,
      12
    );

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookmarkIcon className="h-6 w-6" />
                Bookmarked Quotes
              </h1>
              <p className="text-muted-foreground">
                Quotes you&apos;ve saved to revisit later
              </p>
            </div>
            <Link href="/quotes">
              <Button variant="outline">Browse More Quotes</Button>
            </Link>
          </div>
          
          <Separator />
          
          {/* Content */}
          <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted"></div>
            ))}
          </div>}>
            {result.items.length > 0 ? (
              <div className="space-y-8">
                <QuoteGrid
                  quotes={result.items.map((quote) => ({
                    id: quote.id,
                    slug: quote.slug,
                    content: quote.content,
                    backgroundImage: quote.backgroundImage,
                    author: {
                      name: quote.authorProfile.name,
                      image: quote.authorProfile?.image,
                      slug: quote.authorProfile.slug,
                    },
                    category: {
                      name: quote.category.name,
                      slug: quote.category.slug,
                    },
                  }))}
                />
                
                {/* Pagination */}
                {(result.hasMore || page > 1) && (
                  <div className="flex justify-center gap-2 pt-4">
                    {page > 1 && (
                      <Link href={`/users/${slug}/bookmarks?page=${page - 1}`}>
                        <Button variant="outline">Previous</Button>
                      </Link>
                    )}
                    {result.hasMore && (
                      <Link href={`/users/${slug}/bookmarks?page=${page + 1}`}>
                        <Button variant="outline">Next</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="rounded-full bg-muted p-6">
                  <BookmarkIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No bookmarked quotes yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    When you find quotes you want to revisit later, save them to your bookmarks.
                  </p>
                </div>
                <Link href="/quotes">
                  <Button>Browse Quotes</Button>
                </Link>
              </div>
            )}
          </Suspense>
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
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Try again
          </Button>
        </div>
      </Shell>
    );
  }
}
