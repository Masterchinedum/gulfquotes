import { Suspense } from "react";
import { Shell } from "@/components/shells/shell";
import { QuoteCard } from "./components/quote-card";
import { QuoteListSkeleton } from "./components/quote-list-skeleton";
import { QuoteFilters } from "./components/quote-filters";
import { QuoteGrid } from "./components/quote-grid";
import { QuoteError } from "./components/quote-error";
import { QuoteEmpty } from "./components/quote-empty";
import { publicQuoteService } from "@/lib/services/public-quote/public-quote.service";
import { motion } from "framer-motion";

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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container py-8 space-y-10"
        >
          {/* Header with animation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              Discover and share inspirational quotes from our collection
            </p>
          </motion.div>

          {/* Filters */}
          <QuoteFilters />

          {/* Content */}
          <Suspense fallback={<QuoteListSkeleton />}>
            {result.items.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <QuoteGrid quotes={result.items} />
              </motion.div>
            ) : (
              <QuoteEmpty />
            )}
          </Suspense>
        </motion.div>
      </Shell>
    );
  } catch (error) {
    return <QuoteError message="Failed to load quotes" onRetry={() => window.location.reload()} />;
  }
}