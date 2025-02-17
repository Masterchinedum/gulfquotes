import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface UsePaginationProps {
  totalPages: number
  currentPage: number
}

export function usePagination({ totalPages, currentPage }: UsePaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = useCallback((pageNumber: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }, [pathname, searchParams])

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      router.push(createPageURL(pageNumber))
    }
  }, [router, totalPages, createPageURL])

  return {
    currentPage,
    totalPages,
    createPageURL,
    goToPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}