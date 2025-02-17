"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useCallback, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AuthorSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("search") || "")

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set("search", term)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }, 300)

  const handleFilter = (filter: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete(filter)
    } else {
      params.set(filter, value)
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      handleSearch(e.target.value)
    },
    [handleSearch]
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search authors..."
          onChange={onChange}
          value={value}
          className="pl-8"
        />
      </div>
      <div className="flex gap-2">
        <Select
          onValueChange={(value) => handleFilter("era", value)}
          defaultValue={searchParams.get("era") || "all"}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Era" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Eras</SelectItem>
            <SelectItem value="ancient">Ancient</SelectItem>
            <SelectItem value="medieval">Medieval</SelectItem>
            <SelectItem value="modern">Modern</SelectItem>
            <SelectItem value="contemporary">Contemporary</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}