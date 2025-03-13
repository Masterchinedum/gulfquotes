// components/pagination/user-likes-pagination.tsx
"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface UserLikesPaginationProps {
  page: number;
  totalPages: number;
  userSlug: string;
}

export function UserLikesPagination({ page, totalPages, userSlug }: UserLikesPaginationProps) {
  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious 
              href={`/users/${userSlug}/likes?page=${page - 1}`}
            />
          </PaginationItem>
        )}

        {/* First page */}
        <PaginationItem>
          <PaginationLink
            href={`/users/${userSlug}/likes?page=1`}
            isActive={page === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>

        {/* Show ellipsis if there are many pages before current */}
        {page > 3 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Show pages around current page */}
        {Array.from({ length: totalPages })
          .map((_, i) => i + 1)
          .filter(pageNum => {
            if (totalPages <= 5) return pageNum > 1 && pageNum < totalPages;
            if (page <= 3) return pageNum > 1 && pageNum <= 4;
            if (page >= totalPages - 2) return pageNum >= totalPages - 3 && pageNum < totalPages;
            return pageNum >= page - 1 && pageNum <= page + 1;
          })
          .map(pageNum => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href={`/users/${userSlug}/likes?page=${pageNum}`}
                isActive={page === pageNum}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}

        {/* Show ellipsis if there are many pages after current */}
        {page < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Last page */}
        {totalPages > 1 && (
          <PaginationItem>
            <PaginationLink
              href={`/users/${userSlug}/likes?page=${totalPages}`}
              isActive={page === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}

        {page < totalPages && (
          <PaginationItem>
            <PaginationNext 
              href={`/users/${userSlug}/likes?page=${page + 1}`}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}