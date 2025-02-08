"use client";

import { Quote, User, Category } from "@prisma/client";
import { QuoteCard } from "@/components/quotes/quote-card";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useEffect } from "react";

interface AuthorQuoteListProps {
  authorId: string;
  initialQuotes: (Quote & {
    author: User;
    category: Category;
  })[];
}

interface QuoteResponse {
  data: (Quote & {
    author: User;
    category: Category;
  })[];
  total: number;
  hasMore: boolean;
}

export function AuthorQuoteList({ authorId, initialQuotes }: AuthorQuoteListProps) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<QuoteResponse>({
    queryKey: ["author-quotes", authorId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/author-profiles/${authorId}/quotes?page=${pageParam}`);
      const data = await response.json();
      return data as QuoteResponse;
    },
    initialPageParam: 1, // Add this line
    initialData: {
      pages: [{ data: initialQuotes, hasMore: true, total: initialQuotes.length }],
      pageParams: [1],
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;
      return pages.length + 1;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {data?.pages.map((page, i) => (
          <div key={i} className="grid gap-4">
            {page.data.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center" ref={ref}>
        {isFetchingNextPage && (
          <Button variant="ghost" disabled>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Loading more quotes...
          </Button>
        )}
      </div>
    </div>
  );
}