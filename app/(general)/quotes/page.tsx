import { Suspense } from "react";
import { Shell } from "@/components/shells/shell";
import { QuoteGrid } from "./components/quote-grid";
import { QuoteError } from "./components/quote-error";
import { QuoteEmpty } from "./components/quote-empty";
// import { QuotePagination } from "./components/quote-pagination";
import { QuoteFiltersWrapper } from "./components/quote-filters-wrapper";
import { QuoteListSkeleton } from "./components/quote-list-skeleton";
import { publicQuoteService } from "@/lib/services/public-quote/public-quote.service";
import { notFound } from "next/navigation";
import { QuotePaginationWrapper } from "./components/quote-pagination-wrapper";

// Custom search params interface to avoid clashing with Next.js types
interface CustomSearchParams {
  page?: string;
  category?: string;
  author?: string;
  search?: string;
  sort?: 'recent' | 'popular' | 'length' | 'alphabetical';  // Add type for sort
}

interface PageProps {
  searchParams: Promise<CustomSearchParams>;
}

interface QuoteError {
  code?: string;
  message: string;
}

function isQuoteError(error: unknown): error is QuoteError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "message" in error)
  );
}

export default async function QuotesPage({ searchParams }: PageProps) {
  // Await the searchParams promise before using it
  const params = {
    page: Number((await searchParams)?.page) || 1,
    category: (await searchParams)?.category || "",
    author: (await searchParams)?.author || "",
    search: (await searchParams)?.search || "",
    sort: (await searchParams)?.sort || "recent",
  };

  try {
    const result = await publicQuoteService.list({
      page: params.page,
      limit: 12,
      categoryId: params.category,
      authorProfileId: params.author,
      search: params.search,
      sortBy: params.sort as 'recent' | 'popular' | 'length' | 'alphabetical'
    });

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              Discover and share inspirational quotes from our collection
            </p>
          </div>

          {/* Filters */}
          <QuoteFiltersWrapper 
            initialFilters={{
              search: params.search,
              category: params.category,
              author: params.author,
              sort: params.sort
            }}
          />

          {/* Content */}
          <Suspense fallback={<QuoteListSkeleton />}>
            {result.items.length > 0 ? (
              <QuoteGrid
                quotes={result.items.map((quote) => ({
                  id: quote.id,
                  slug: quote.slug,
                  content: quote.content,
                  backgroundImage: quote.backgroundImage,
                  author: {
                    name: quote.authorProfile.name,
                    image: quote.authorProfile.image,
                    slug: quote.authorProfile.slug,
                  },
                  category: {
                    name: quote.category.name,
                    slug: quote.category.slug,
                  },
                }))}
              />
            ) : (
              <QuoteEmpty />
            )}

            {/* Pagination */}
            {result.hasMore && (
              <QuotePaginationWrapper
                currentPage={params.page}
                hasMore={result.hasMore}
              />
            )}
          </Suspense>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("Failed to load quotes:", error);
    
    if (isQuoteError(error) && error.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <Shell>
        <QuoteError
          message={
            isQuoteError(error) 
              ? error.message 
              : "Failed to load quotes. Please try again later."
          }
          onRetry={() => window.location.reload()}
        />
      </Shell>
    );
  }
}
