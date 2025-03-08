"use client";

import { useState, useEffect, useRef } from "react";
import { SearchSuggestion } from "@/types/search";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Loader2, Search, TrendingUp } from "lucide-react";

interface SearchAutocompleteProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuery?: string;
  onSubmit: (query: string) => void;
}

export function SearchAutocomplete({
  isOpen,
  onClose,
  defaultQuery = "",
  onSubmit,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [popular, setPopular] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const commandRef = useRef<HTMLInputElement>(null);

  // When the component mounts, focus the input
  useEffect(() => {
    if (isOpen) {
      setQuery(defaultQuery);
      setTimeout(() => {
        commandRef.current?.querySelector("input")?.focus();
      }, 50);
    }
  }, [isOpen, defaultQuery]);

  // Fetch suggestions when query changes
  useEffect(() => {
    // Only fetch if we're open and the query has at least 2 characters
    if (!isOpen) return;
    
    // Build URL for the API call
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query);
      params.set("limit", "5");
    } else {
      params.set("includeTrending", "true");
      params.set("limit", "5");
    }
    
    // API call to get suggestions
    const fetchSuggestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/search/suggestions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }
        
        const data = await response.json();
        
        // Update suggestions and popular searches
        if (data.data) {
          setSuggestions(data.data.suggestions || []);
          setPopular(data.data.popular || []);
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
        setSuggestions([]);
        setPopular([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce API calls using a timeout
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  // Handle selection of a suggestion
  const handleSelect = (value: string) => {
    console.log("Search selected:", value); // Debug log
    onSubmit(value);
    onClose();
  };

  // Handle form submission for manual entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
      onClose();
      
      // Add a console log to confirm submission
      console.log("Submitting search query:", query);
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <form onSubmit={handleSubmit}>
        <CommandInput
          ref={commandRef}
          placeholder="Search quotes, authors, or users..."
          value={query}
          onValueChange={setQuery}
          // Add this key handler
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
      </form>
      
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Searching...</span>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </CommandEmpty>
        
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <CommandGroup heading="Suggestions">
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.query}
                value={suggestion.query}
                onSelect={handleSelect}
              >
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{suggestion.query}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Popular searches */}
        {popular.length > 0 && !query.trim() && (
          <>
            {suggestions.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Popular Searches">
              {popular.map((item) => (
                <CommandItem
                  key={item.query}
                  value={item.query}
                  onSelect={handleSelect}
                >
                  <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.query}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}