// app/(general)/featured/page.tsx
import { Suspense } from "react";
import { Shell } from "@/components/shells/shell";
import { QuoteGrid } from "../quotes/components/quote-grid";
import { QuoteListSkeleton } from "../quotes/components/quote-list-skeleton";
import { QuoteEmpty } from "../quotes/components/quote-empty";
import { QuoteError } from "../quotes/components/quote-error";
import { QuotePaginationWrapper } from "../quotes/components/quote-pagination-wrapper";
import { db } from "@/lib/prisma";
import { Metadata } from "next";

// Custom search params interface
interface CustomSearchParams {
  page?: string;
  limit?: string;
  categoryId?: string;
  authorProfileId?: string;
}

interface PageProps {
  searchParams?: CustomSearchParams;
}

// Add metadata
export const metadata: Metadata = {
  title: "Featured Quotes | Quoticon",
  description: "Discover our collection of handpicked featured quotes",
};

export default async function FeaturedQuotesPage({ searchParams = {} }: PageProps) {
  // Parse search params with defaults
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  const categoryId = searchParams.categoryId;
  const authorProfileId = searchParams.authorProfileId;

  try {
    // Fetch featured quotes
    const [quotes, total] = await Promise.all([
      db.quote.findMany({
        where: {
          featured: true,
          ...(categoryId && { categoryId }),
          ...(authorProfileId && { authorProfileId }),
        },
        include: {
          authorProfile: true,
          category: true,
          _count: {
            select: {
              quoteLikes: true,
              comments: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.quote.count({
        where: {
          featured: true,
          ...(categoryId && { categoryId }),
          ...(authorProfileId && { authorProfileId }),
        },
      }),
    ]);

    const hasMore = total > (page - 1) * limit + quotes.length;

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Featured Quotes</h1>
            <p className="text-muted-foreground">
              Our curated selection of exceptional quotes
            </p>
          </div>

          {/* Content */}
          <Suspense fallback={<QuoteListSkeleton />}>
            {quotes.length > 0 ? (
              <QuoteGrid
                quotes={quotes.map((quote) => ({
                  id: quote.id,
                  slug: quote.slug,
                  content: quote.content,
                  backgroundImage: quote.backgroundImage,
                  featured: quote.featured,
                  author: {
                    name: quote.authorProfile.name,
                    image: quote.authorProfile.image,
                    slug: quote.authorProfile.slug,
                  },
                  category: {
                    name: quote.category.name,
                    slug: quote.category.slug,
                  },
                  metrics: {
                    likes: quote._count.quoteLikes,
                    comments: quote._count.comments,
                  },
                }))}
              />
            ) : (
              <QuoteEmpty />
            )}

            {/* Pagination */}
            {hasMore && (
              <QuotePaginationWrapper
                currentPage={page}
                hasMore={hasMore}
              />
            )}
          </Suspense>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("Failed to load featured quotes:", error);
    
    return (
      <Shell>
        <QuoteError
          message="Failed to load featured quotes. Please try again later."
          onRetry={() => window.location.reload()}
        />
      </Shell>
    );
  }
}