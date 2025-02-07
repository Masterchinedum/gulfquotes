"use client";

import { Quote, User, Category } from "@prisma/client";
import { QuoteCard } from "@/components/quotes/quote-card";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Icons } from "@/components/ui/icons";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

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
    return (
      <div className="space-y-4 min-h-[200px] flex items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === "error") {
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
  );
}