// components/notifications/NotificationPagination.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis  // Add this import
} from "@/components/ui/pagination";

interface NotificationPaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function NotificationPagination({ 
  totalPages, 
  currentPage,
  onPageChange
}: NotificationPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Helper to create page URLs
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };
  
  return (
    <div className="space-y-4">
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious 
                href={createPageURL(currentPage - 1)} 
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(currentPage - 1);
                }}
              />
            </PaginationItem>
          )}
          
          {/* First page */}
          <PaginationItem>
            <PaginationLink
              href={createPageURL(1)}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(1);
              }}
              isActive={currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
          
          {/* Middle pages */}
          {totalPages > 5 && currentPage > 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
          {Array.from({ length: totalPages })
            .map((_, i) => i + 1)
            .filter(page => {
              if (totalPages <= 5) return page > 1 && page < totalPages;
              if (currentPage <= 3) return page > 1 && page <= 4;
              if (currentPage >= totalPages - 2) return page >= totalPages - 3 && page < totalPages;
              return page >= currentPage - 1 && page <= currentPage + 1;
            })
            .map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={createPageURL(page)}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
          {/* Ellipsis before last page */}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
          {/* Last page (if more than 1 page) */}
          {totalPages > 1 && (
            <PaginationItem>
              <PaginationLink
                href={createPageURL(totalPages)}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(totalPages);
                }}
                isActive={currentPage === totalPages}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext 
                href={createPageURL(currentPage + 1)}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(currentPage + 1);
                }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
      
      <div className="text-center text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}