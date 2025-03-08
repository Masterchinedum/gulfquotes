"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Added Button import
import { SearchIcon, Loader2 } from "lucide-react"; // Remove Command icon import
import { SearchAutocomplete } from "./SearchAutocomplete"; // Import our new component

export function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const currentQuery = searchParams.get("q") ?? "";

  // Handle submission (both from form and from autocomplete)
  function handleSubmit(query: string) {
    setError(undefined);
    
    if (!query.trim()) {
      setError("Please enter a search term");
      return;
    }

    // Add console log for debugging
    console.log("SearchField handling submission for query:", query);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", query);
      console.log("Navigating to:", `/search?${params.toString()}`);
      router.push(`/search?${params.toString()}`);
    });
  }

  // Handle form submission
  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString().trim() ?? "";
    handleSubmit(query);
  }

  // Open the autocomplete dialog
  function openAutocomplete() {
    setIsAutocompleteOpen(true);
  }

  return (
    <>
      <div className="flex w-full relative">
        <form onSubmit={handleFormSubmit} className="relative w-full">
          <Input
            type="search"
            name="q"
            placeholder="Search quotes, authors, or users..."
            defaultValue={currentQuery}
            className="pr-20" // Extra padding for the shortcut pill
            onClick={openAutocomplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.form?.requestSubmit();
              }
            }}
            onFocus={openAutocomplete}
          />
          
          {/* Search button inside the input */}
          <Button 
            type="submit"
            variant="ghost" 
            size="sm"
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
            {/* Show keyboard shortcut on larger screens */}
            <kbd className="hidden ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              /
            </kbd>
          </Button>
        </form>
      </div>
      
      {/* Command+K shortcut to open autocomplete */}
      <div className="flex items-center">
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
        
        {/* Keyboard shortcut listener */}
        <kbd className="sr-only">Press / to search</kbd>
      </div>
      
      {/* Autocomplete component */}
      <SearchAutocomplete 
        isOpen={isAutocompleteOpen} 
        onClose={() => setIsAutocompleteOpen(false)}
        defaultQuery={currentQuery}
        onSubmit={handleSubmit}
      />
    </>
  );
}
