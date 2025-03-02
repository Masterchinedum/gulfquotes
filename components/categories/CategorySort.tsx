// components/categories/CategorySort.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface CategorySortProps {
  sort: string;
  total: number;
  count: number;
}

export function CategorySort({ sort, total, count }: CategorySortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page"); // Reset to page 1 when sorting
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {count} of {total} quotes
      </p>
      
      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="quote-sort" className="sr-only">Sort quotes by</label>
        <select 
          id="quote-sort"
          className="text-sm border rounded-md px-2 py-1"
          value={sort}
          aria-label="Sort quotes by"
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>
    </div>
  );
}