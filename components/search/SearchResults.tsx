import { SearchResult, SearchResponse } from "@/types/search";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronDown, ChevronUp, Book, Users, User } from "lucide-react";
import { ResultCard } from "./ResultCards";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  results?: SearchResponse;
  isLoading: boolean;
  error?: string;
}

export function SearchResults({ results, isLoading, error }: SearchResultsProps) {
  // Track expanded/collapsed states for each result type
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quotes: true,
    authors: true,
    users: true
  });

  const toggleSection = (type: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!results || results.results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No results founds
        </CardContent>
      </Card>
    );
  }

  // Group results by type
  const groupedResults = results.results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Get search query from results
  const searchQuery = results.results.length > 0 
    ? (() => {
        const firstResult = results.results[0];
        
        // First check the type of result
        switch(firstResult.type) {
          case "quotes":
            return firstResult.data.content.split(" ").slice(0, 3).join(" ");
          case "authors":
            return firstResult.data.name;
          case "users":
            return firstResult.data.name || "";
          default:
            return "";
        }
      })()
    : "";

  // Type icons for headers
  const typeIcons = {
    quotes: <Book className="h-5 w-5" />,
    authors: <Users className="h-5 w-5" />,
    users: <User className="h-5 w-5" />
  };

  // Display names for types
  const typeNames = {
    quotes: "Quotes",
    authors: "Authors",
    users: "Users"
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedResults).map(([type, items]) => (
        <section key={type} className="space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection(type)}
          >
            <div className="flex items-center gap-2">
              {typeIcons[type as keyof typeof typeIcons]}
              <h2 className="text-lg font-semibold">
                {typeNames[type as keyof typeof typeNames]} ({items.length})
              </h2>
            </div>
            <Button variant="ghost" size="sm">
              {expandedSections[type] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className={cn(
            "grid gap-4 transition-all",
            expandedSections[type] ? "grid-rows-[1fr]" : "grid-rows-[0fr] overflow-hidden"
          )}>
            <div className="min-h-0">
              {items.map((result) => (
                <div key={result.id} className="mb-4">
                  <ResultCard result={result} searchQuery={searchQuery} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
      
      {results.hasMore && (
        <div className="text-center pt-4">
          <Button 
            variant="outline"
            onClick={() => {
              // Handle pagination
            }}
          >
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
}