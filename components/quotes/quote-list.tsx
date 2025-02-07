"use client";

import { Quote, User, Category } from "@prisma/client";
import { QuoteCard } from "@/components/quotes/quote-card";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Icons } from "@/components/ui/icons";
import { useEffect } from "react";

interface QuoteListProps {
  initialQuotes: (Quote & {
    author: User;
    category: Category;
  })[];
}

async function fetchQuotes({ pageParam = 1 }) {
  const response = await fetch(`/api/quotes?page=${pageParam}`);
  const data = await response.json();
  return data;
}

export function QuoteList({ initialQuotes }: QuoteListProps) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
    initialData: {
      pages: [{ data: initialQuotes }],
      pageParams: [1],
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.data.length === 0 ? undefined : pages.length + 1;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (status === "loading") {
    return <div className="space-y-4">Loading...</div>;
  }

  if (status === "error") {
    return <div className="text-destructive">Error loading quotes</div>;
  }

  if (!data?.pages[0].data.length) {
    return (
      <div className="text-center py-10">
        <Icons.quote className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">No quotes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating a new quote.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {data.pages.map((page, i) => (
        <div key={i} className="space-y-8">
          {page.data.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      ))}
      
      <div className="flex justify-center" ref={ref}>
        {isFetchingNextPage && (
          <Button variant="ghost" disabled>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Loading more...
          </Button>
        )}
      </div>
    </div>
  );
}