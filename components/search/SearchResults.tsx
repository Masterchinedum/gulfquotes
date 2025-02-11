import { SearchResult, SearchResponse } from "@/types/search";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Loader2 } from "lucide-react";

interface SearchResultsProps {
  results?: SearchResponse;
  isLoading: boolean;
  error?: string;
}

export function SearchResults({ results, isLoading, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!results || results.results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No results found
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

  return (
    <div className="space-y-6">
      {Object.entries(groupedResults).map(([type, items]) => (
        <section key={type} className="space-y-4">
          <h2 className="text-lg font-semibold capitalize">{type}</h2>
          <div className="grid gap-4">
            {items.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  switch (result.type) {
    case "quotes":
      return (
        <Card>
          <CardContent className="p-4">
            <blockquote className="space-y-2">
              <p className="text-sm">{result.data.content}</p>
              <footer className="text-xs text-muted-foreground">
                by {result.data.authorName} • {result.data.category}
              </footer>
            </blockquote>
          </CardContent>
        </Card>
      );
    
    case "authors":
      return (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <h3 className="font-semibold">{result.data.name}</h3>
              {result.data.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {result.data.bio}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    
    case "users":
      return (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={result.data.image || ""} />
                <AvatarFallback>{result.data.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{result.data.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
  }
}