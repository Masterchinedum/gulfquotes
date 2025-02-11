"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchResponse, SearchApiResponse } from "@/types/search";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchField }  from "@/components/search/SearchField";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

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

  return (
    <div className="container space-y-6 py-8">
      <div className="mx-auto max-w-2xl">
        <SearchField />
      </div>
      
      {searchParams.get("q") && (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-8">
            Search Results for &ldquo;{searchParams.get("q")}&quot;
          </h1>
          <SearchResults 
            results={results}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}
    </div>
  );
}