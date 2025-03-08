"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchSuggestion } from "@/types/search";
// import { Loader2 } from "lucide-react";

interface RelatedSearchesProps {
  query: string;
  className?: string;
}

export function RelatedSearches({ query, className }: RelatedSearchesProps) {
  const [relatedSearches, setRelatedSearches] = useState<SearchSuggestion[]>([]);
  const [didYouMeanSuggestion, setDidYouMeanSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Only load related searches if we have a query
    if (!query?.trim()) {
      setRelatedSearches([]);
      setDidYouMeanSuggestion(null);
      return;
    }
    
    const fetchRelatedSearches = async () => {
      try {
        setIsLoading(true);
        
        // Fetch related searches with extended parameters
        const params = new URLSearchParams();
        params.set("q", query);
        params.set("includeRelated", "true");
        params.set("includeCorrection", "true");
        params.set("limit", "5");
        
        const response = await fetch(`/api/search/suggestions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch related searches");
        }
        
        const data = await response.json();
        
        // Update suggestions and spelling correction
        if (data.data) {
          setRelatedSearches(data.data.related || []);
          setDidYouMeanSuggestion(data.data.correction || null);
        }
      } catch (error) {
        console.error("Error fetching related searches:", error);
        setRelatedSearches([]);
        setDidYouMeanSuggestion(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRelatedSearches();
  }, [query]);
  
  // Handle click on a related search term
  const handleRelatedSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", term);
    params.set("page", "1"); // Reset to first page
    router.push(`/search?${params.toString()}`);
  };
  
  // If there's nothing to show, return null
  if (isLoading || (!didYouMeanSuggestion && relatedSearches.length === 0)) {
    return null;
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* "Did you mean" suggestion */}
      {didYouMeanSuggestion && (
        <div className="text-sm">
          <span className="text-muted-foreground">Did you mean: </span>
          <Button
            variant="link"
            className="p-0 h-auto font-medium underline-offset-4"
            onClick={() => handleRelatedSearch(didYouMeanSuggestion)}
          >
            {didYouMeanSuggestion}
          </Button>
        </div>
      )}
      
      {/* Related searches */}
      {relatedSearches.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Related searches</h3>
          <div className="flex flex-wrap gap-2">
            {relatedSearches.map((item) => (
              <Button
                key={item.query}
                variant="secondary"
                size="sm"
                className="text-xs font-normal"
                onClick={() => handleRelatedSearch(item.query)}
              >
                {item.query}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}