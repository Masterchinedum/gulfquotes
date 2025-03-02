// components/categories/CategoriesFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface CategoriesFilterProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  className?: string;
}

export function CategoriesFilter({
  totalItems,
//   currentPage,
//   totalPages,
  className,
}: CategoriesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState(searchParams.get("sortBy") || "name");
  const [order, setOrder] = useState(searchParams.get("order") || "asc");
  
  // Update URL with new sort/order parameters
  const updateFilters = (newSort?: string, newOrder?: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (newSort) {
      params.set("sortBy", newSort);
    }
    
    if (newOrder) {
      params.set("order", newOrder);
    }
    
    // Reset to first page when changing sort
    params.delete("page");
    
    router.push(`/categories?${params.toString()}`);
  };
  
  // Clear all filters
  const clearFilters = () => {
    const params = new URLSearchParams();
    
    // Preserve search query if it exists
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    
    router.push(`/categories?${params.toString()}`);
  };
  
  // Keep local state in sync with URL
  useEffect(() => {
    setSort(searchParams.get("sortBy") || "name");
    setOrder(searchParams.get("order") || "asc");
  }, [searchParams]);
  
  // Determine if any filters are active
  const hasActiveFilters = searchParams.has("sortBy") || searchParams.has("order");
  
  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalItems > 0 ? (
            <>
              Showing <span className="font-medium">{totalItems}</span> categories
              {searchParams.get("search") && (
                <> for &quot;<span className="font-medium">{searchParams.get("search")}</span>&quot;</>
              )}
            </>
          ) : (
            <>No categories found</>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={sort}
            onValueChange={(value) => updateFilters(value, order)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="popular">Most Quotes</SelectItem>
              <SelectItem value="recent">Newest</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={order}
            onValueChange={(value) => updateFilters(sort, value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}