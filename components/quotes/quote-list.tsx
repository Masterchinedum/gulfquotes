"use client";

import { useState, useEffect } from "react";
import { Quote, User, Category, UserRole } from "@prisma/client";
import { QuoteCard } from "@/components/quotes/quote-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, QueryFunctionContext } from "@tanstack/react-query";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface QuoteListProps {
  initialQuotes: Array<Quote & {
    author: {
      id: string;
      name: string | null;
      email: string | null;
      emailVerified: Date | null;
      image: string | null;
      password: string | null;
      isTwoFactorEnabled: boolean;
      role: UserRole;
    };
    category: Category;
  }>;
}

interface QuoteResponse {
  data: (Quote & { author: User; category: Category })[];
  total: number;
  hasMore: boolean;
}

type QuoteQueryKey = ["quotes", string];

async function fetchQuotes({ pageParam, queryKey }: QueryFunctionContext<QuoteQueryKey, number>): Promise<QuoteResponse> {
  const [, search] = queryKey;
  const response = await fetch(`/api/quotes?page=${pageParam}&search=${encodeURIComponent(search)}`);
  const data = await response.json();
  return data;
}

export function QuoteList({ initialQuotes }: QuoteListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["quotes", searchTerm] as QuoteQueryKey,
    queryFn: fetchQuotes,
    initialPageParam: 1,
    initialData: {
      pages: [{ data: initialQuotes, total: initialQuotes.length, hasMore: false }],
      pageParams: [1],
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.data.length + 1 : undefined;
    },
    refetchOnMount: false
  });

  // Only refetch when searchTerm changes, not on mount
  useEffect(() => {
    if (searchTerm) { // Only refetch if there's a search term
        refetch();
    }
  }, [searchTerm, refetch]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4 min-h-[200px] flex items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive min-h-[200px] flex items-center justify-center">
        Error loading quotes
      </div>
    );
  }

  if (!data?.pages[0].data.length) {
    return (
      <div className={cn(
        "text-center py-10 min-h-[200px]",
        "flex flex-col items-center justify-center",
        "border rounded-lg bg-muted/50"
      )}>
        <Icons.quote className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-sm font-medium">No quotes</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating a new quote.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search quotes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <div className={cn(
        "space-y-8",
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        "gap-6"
      )}>
        {data.pages.map((page, i) => (
          <div key={i} className="space-y-8">
            {page.data.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        ))}
        
        <div className="flex justify-center col-span-full" ref={ref}>
          {isFetchingNextPage && (
            <Button variant="ghost" disabled>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Loading more...
            </Button>
          )}
        </div>
      </div>
    </>
  );
}