import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useAuthorFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const getCurrentFilter = useCallback((key: string) => {
    return searchParams.get(key) || "all"
  }, [searchParams])

  return {
    setFilter,
    getCurrentFilter
  }
}