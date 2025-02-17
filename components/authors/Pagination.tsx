"use client"

import { useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface AuthorPaginationProps {
  totalPages: number
  currentPage: number
}

export function AuthorPagination({ totalPages, currentPage }: AuthorPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = useCallback(
    (pageNumber: number | string) => {
      const params = new URLSearchParams(searchParams)
      params.set("page", pageNumber.toString())
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  // Generate array of page numbers to show
  const getVisiblePages = useCallback(() => {
    return [...Array(totalPages)].map((_, i) => {
      const page = i + 1
      const isCurrentPage = page === currentPage

      // Always show first page, last page, and pages around current page
      if (
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1)
      ) {
        return (
          <PaginationItem key={page}>
            <PaginationLink
              href={createPageURL(page)}
              isActive={isCurrentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        )
      }

      // Show ellipsis for gaps in pagination
      if (page === currentPage - 2 || page === currentPage + 2) {
        return (
          <PaginationItem key={page}>
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        )
      }

      return null
    })
  }, [currentPage, totalPages, createPageURL])

  return (
    <Pagination>
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={createPageURL(currentPage - 1)} />
          </PaginationItem>
        )}
        
        {getVisiblePages()}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={createPageURL(currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}