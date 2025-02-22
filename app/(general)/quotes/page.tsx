import { Suspense } from "react";
import { Shell } from "@/components/shells/shell";
import { QuoteGrid } from "./components/quote-grid";
import { QuoteFilters } from "./components/quote-filters";
import { QuoteError } from "./components/quote-error";
import { QuoteEmpty } from "./components/quote-empty";
import { QuotePagination } from "./components/quote-pagination";
import { QuoteListSkeleton } from "./components/quote-list-skeleton";
import { publicQuoteService } from "@/lib/services/public-quote/public-quote.service";
import { notFound } from "next/navigation";

interface QuotesPageProps {
  searchParams: {
    page?: string;
    category?: string;
    author?: string;
    search?: string;
    sort?: string;
  };
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

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  // Wait for searchParams to be ready
  const params = {
    page: Number(await searchParams?.page) || 1,
    category: await searchParams?.category || "",
    author: await searchParams?.author || "",
    search: await searchParams?.search || "",
    sort: await searchParams?.sort || "recent",
  };

  try {
    const result = await publicQuoteService.list({
      page: params.page,
      limit: 12,
      categoryId: params.category,
      authorProfileId: params.author,
      search: params.search,
      sort: params.sort,
    });

    return (
      <Shell>
        <div className="container py-8 space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              Discover and share inspirational quotes from our collection
            </p>
          </div>

          {/* Filters */}
          <QuoteFilters 
            initialFilters={{
              search: params.search || "",
              category: params.category || "",
              author: params.author || "",
              sort: params.sort || "recent"
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
              <QuotePagination
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