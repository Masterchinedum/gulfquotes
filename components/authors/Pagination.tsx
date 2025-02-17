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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <Select
        defaultValue="10"
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams)
          params.set("limit", value)
          params.set("page", "1")
          window.location.href = `${pathname}?${params.toString()}`
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Items per page" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 per page</SelectItem>
          <SelectItem value="20">20 per page</SelectItem>
          <SelectItem value="50">50 per page</SelectItem>
        </SelectContent>
      </Select>

      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious href={createPageURL(currentPage - 1)} />
            </PaginationItem>
          )}
          
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1
            const isCurrentPage = page === currentPage

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

            if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <PaginationItem key={page}>
                  <PaginationLink>...</PaginationLink>
                </PaginationItem>
              )
            }

            return null
          })}

          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext href={createPageURL(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  )
}