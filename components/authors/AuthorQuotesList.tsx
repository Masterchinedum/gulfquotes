// components/authors/AuthorQuotesList.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { QuoteCard } from "@/app/(general)/quotes/components/quote-card";
import { cn } from "@/lib/utils";

interface AuthorQuotesListProps {
  authorId: string;
  authorName: string;
  authorSlug: string;
  className?: string;
  initialQuotes?: {
    quotes: QuoteDisplayData[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export function AuthorQuotesList({
//   authorId,
  authorName,
  authorSlug,
  className,
  initialQuotes
}: AuthorQuotesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Parse query parameters
  const page = Number(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sort") as 'recent' | 'popular' | 'likes' || 'recent';
  
  // State variables
  const [quotes, setQuotes] = useState<QuoteDisplayData[]>(initialQuotes?.quotes || []);
  const [loading, setLoading] = useState(!initialQuotes);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: initialQuotes?.page || 1,
    limit: initialQuotes?.limit || 10,
    total: initialQuotes?.total || 0,
    hasMore: initialQuotes?.hasMore || false
  });
  
  // Fetch quotes when parameters change
  useEffect(() => {
    if (initialQuotes && page === 1 && sortBy === 'recent') {
      // Use initial quotes for first page with default sorting
      return;
    }
    
    const fetchQuotes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Construct the API URL with query parameters
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          sort: sortBy
        });
        
        const response = await fetch(`/api/authors/${authorSlug}/quotes?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to load quotes');
        }
        
        setQuotes(data.data.quotes);
        setPagination({
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.total,
          hasMore: data.data.hasMore
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuotes();
  }, [page, sortBy, authorSlug, initialQuotes]);
  
  // Update URL when sort option changes
  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.set("page", "1"); // Reset to page 1 when sort changes
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Navigate to a specific page
  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Quotes by {authorName}</CardTitle>
          <CardDescription>
            {pagination.total} quote{pagination.total !== 1 ? 's' : ''}
          </CardDescription>
        </div>
        
        {/* Sorting control */}
        <div>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort by</SelectLabel>
                <SelectItem value="recent">Newest first</SelectItem>
                <SelectItem value="popular">Most downloaded</SelectItem> {/* Changed from "Most viewed" to "Most downloaded" */}
                <SelectItem value="likes">Most liked</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                goToPage(1);
              }}
            >
              Try again
            </Button>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No quotes found for this author.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quotes.map(quote => (
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
            
            {/* Pagination controls */}
            {pagination.total > pagination.limit && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) },
                    (_, i) => {
                      // Calculate the page number to display
                      let pageNum;
                      const totalPages = Math.ceil(pagination.total / pagination.limit);
                      
                      if (totalPages <= 5) {
                        // If there are 5 or fewer pages, show all pages
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        // If current page is near the beginning
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        // If current page is near the end
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Current page is in the middle
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={i}
                          variant={page === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => goToPage(pageNum)}
                          className="h-8 w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(page + 1)}
                  disabled={!pagination.hasMore}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}