'use client';

import { useRouter } from "next/navigation";
import { QuotePagination } from "./quote-pagination";

interface QuotePaginationWrapperProps {
  currentPage: number;
  hasMore: boolean;
}

export function QuotePaginationWrapper({ currentPage, hasMore }: QuotePaginationWrapperProps) {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    router.push(url.pathname + url.search);
  };

  return (
    <QuotePagination
      currentPage={currentPage}
      hasMore={hasMore}
      onPageChange={handlePageChange}
    />
  );
}