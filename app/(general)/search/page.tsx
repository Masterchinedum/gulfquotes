"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchResponse, SearchApiResponse } from "@/types/search";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchField } from "@/components/search/SearchField";
import { SearchTabs } from "@/components/search/SearchTabs";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// First, define a type for the result counts
type ResultCounts = {
  quotes: number;
  authors: number;
  users: number;
  all: number;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function performSearch() {
      setIsLoading(true);
      setError(undefined);
      
      try {
        const response = await fetch(`/api/search?${searchParams.toString()}`);
        
        if (!response.ok) {
          throw new Error("Search failed");
        }
        
        const data: SearchApiResponse = await response.json();
        
        if (data.error) {
          setError(data.error.message);
        } else {
          setResults(data.data);
        }
      } catch {
        setError("Failed to perform search. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    const query = searchParams.get("q");
    if (query?.trim()) {
      performSearch();
    }
  }, [searchParams]);

  // Count results by type
  const totalsByType = results?.results.reduce<ResultCounts>((acc, result) => {
    if (result.type === 'quotes' || result.type === 'authors' || result.type === 'users') {
      acc[result.type] += 1;
    }
    return acc;
  }, { quotes: 0, authors: 0, users: 0, all: 0 });

  if (totalsByType) {
    totalsByType.all = totalsByType.quotes + totalsByType.authors + totalsByType.users;
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl mb-8">
        <SearchField />
      </div>
      
      {searchParams.get("q") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              Search Results for &ldquo;{searchParams.get("q")}&quot;
            </h1>
            
            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SearchFilters 
                    facets={results?.facets} 
                    onClose={() => setMobileFiltersOpen(false)}
                    isMobile={true}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <SearchTabs 
            totalResults={totalsByType} 
            className="mb-6"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <SearchFilters facets={results?.facets} />
              </div>
            </div>
            
            {/* Search Results */}
            <div className="lg:col-span-3">
              <SearchResults 
                results={results}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}