import Link from "next/link";
import { SearchResult } from "@/types/search";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Quote as QuoteIcon, Star } from "lucide-react";
// import { cn } from "@/lib/utils";
import { SearchSnippet } from "./SearchSnippet";
// import { formatDistanceToNow } from "date-fns";

interface ResultCardProps {
  result: SearchResult;
  searchQuery: string;
}

export function ResultCard({ result, searchQuery }: ResultCardProps) {
  switch (result.type) {
    case "quotes":
      return <QuoteResultCard result={result} searchQuery={searchQuery} />;
    case "authors":
      return <AuthorResultCard result={result} searchQuery={searchQuery} />;
    case "users":
      return <UserResultCard result={result} searchQuery={searchQuery} />;
    default:
      return null;
  }
}

function QuoteResultCard({ result, searchQuery }: ResultCardProps) {
  const { content, slug, authorName, category } = result.data;
  
  // Truncate content if it's too long
  const maxContentLength = 250;
  const displayContent = content.length > maxContentLength
    ? content.substring(0, maxContentLength) + "..."
    : content;

  return (
    <Link href={`/quotes/${slug}`}>
      <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="p-4 pb-2">
          <div className="mb-2">
            <Badge 
              variant="outline" 
              className="mb-2 text-xs font-normal"
            >
              {category}
            </Badge>
          </div>
          
          <blockquote className="space-y-2">
            <div className="font-serif text-lg">
              <SearchSnippet 
                text={displayContent} 
                query={searchQuery} 
                className="leading-relaxed"
              />
            </div>
          </blockquote>
        </CardContent>
        
        <CardFooter className="pt-0 pb-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QuoteIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">
              <SearchSnippet text={authorName} query={searchQuery} />
            </span>
          </div>
          
          {result.score >= 3 && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1 text-amber-500" />
              Highly Relevant
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

function AuthorResultCard({ result, searchQuery }: ResultCardProps) {
  const { name, slug, bio } = result.data;
  
  // Truncate bio if it's too long
  const maxBioLength = 150;
  const displayBio = bio && bio.length > maxBioLength
    ? bio.substring(0, maxBioLength) + "..."
    : bio;

  return (
    <Link href={`/authors/${slug}`}>
      <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border">
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div>
              <CardTitle className="text-base">
                <SearchSnippet text={name} query={searchQuery} />
              </CardTitle>
              <CardDescription className="text-xs">Author</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {displayBio && (
          <CardContent className="pt-0 pb-2 px-4">
            <div className="text-sm text-muted-foreground line-clamp-2">
              <SearchSnippet text={displayBio} query={searchQuery} />
            </div>
          </CardContent>
        )}
        
        <CardFooter className="pt-0 pb-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <QuoteIcon className="h-3 w-3" />
              <span>Multiple quotes</span>
            </div>
          </div>
          
          {result.score >= 2 && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1 text-amber-500" />
              Relevant
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

function UserResultCard({ result, searchQuery }: ResultCardProps) {
  const { name, image } = result.data;

  return (
    <Link href={`/users/${result.id}`}>
      <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={image || ""} alt={name} />
            <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <h3 className="font-medium">
              <SearchSnippet text={name} query={searchQuery} />
            </h3>
            <p className="text-xs text-muted-foreground">Community Member</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}