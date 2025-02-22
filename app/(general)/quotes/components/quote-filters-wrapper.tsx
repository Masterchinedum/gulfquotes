'use client';

import { useRouter } from "next/navigation";
import { QuoteFilters } from "./quote-filters";

interface QuoteFiltersWrapperProps {
  initialFilters: {
    search: string;
    category: string;
    author: string;
    sort: string;
  };
}

export function QuoteFiltersWrapper({ initialFilters }: QuoteFiltersWrapperProps) {
  const router = useRouter();

  const handleUpdate = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    url.searchParams.delete("page"); // Reset page when filtering
    router.push(url.pathname + url.search);
  };

  return (
    <QuoteFilters 
      initialFilters={initialFilters}
      onUpdate={handleUpdate}
    />
  );
}