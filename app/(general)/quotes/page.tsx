import { Suspense } from "react";
import { Shell } from "@/components/shells/shell";
import { QuoteCard } from "./components/quote-card";
import { QuoteListSkeleton } from "./components/quote-list-skeleton";
import { publicQuoteService } from "@/lib/services/public-quote/public-quote.service";

interface QuotesPageProps {
  searchParams: {
    page?: string;
    category?: string;
    author?: string;
    search?: string;
  };
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const page = Number(searchParams.page) || 1;
  const limit = 12; // Number of quotes per page

  try {
    // Fetch quotes with filters and pagination
    const result = await publicQuoteService.list({
      page,
      limit,
      categoryId: searchParams.category,
      authorProfileId: searchParams.author,
      search: searchParams.search,
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

          {/* Quotes Grid */}
          <Suspense fallback={<QuoteListSkeleton />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.items.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  quote={{
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
                  }}
                />
              ))}
            </div>

            {/* Empty State */}
            {result.items.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <p className="text-muted-foreground">No quotes found</p>
              </div>
            )}

            {/* Pagination */}
            {result.hasMore && (
              <div className="flex justify-center mt-10">
                <nav className="flex gap-2">
                  {page > 1 && (
                    <a
                      href={`/quotes?page=${page - 1}`}
                      className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
                    >
                      Previous
                    </a>
                  )}
                  <a
                    href={`/quotes?page=${page + 1}`}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
                  >
                    Next
                  </a>
                </nav>
              </div>
            )}
          </Suspense>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error(error); // Log the error for debugging
    return (
      <Shell>
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <h3 className="font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              Failed to load quotes. Please try again later.
            </p>
          </div>
        </div>
      </Shell>
    );
  }
}