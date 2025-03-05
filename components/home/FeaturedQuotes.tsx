"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2, AlertCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useFeaturedQuotes } from "@/hooks/use-featured-quotes";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Use the same type as in our hook
interface FeaturedQuote {
  id: string;
  content: string;
  slug: string;
  backgroundImage: string | null;
  featured: boolean;
  createdAt: string;
  authorProfile: {
    name: string;
    image?: string | null;
    slug: string;
  };
  category: {
    name: string;
    slug: string;
  };
  _count?: {
    quoteLikes?: number;
    comments?: number;
  };
}

interface FeaturedQuotesProps {
  initialQuotes?: FeaturedQuote[];
  limit?: number;
}

export function FeaturedQuotes({ initialQuotes, limit = 6 }: FeaturedQuotesProps) {
  const router = useRouter();
  
  // Use our custom hook with initial data if provided
  const { quotes, isLoading, error } = useFeaturedQuotes({
    initialData: initialQuotes ? {
      data: initialQuotes,
      page: 1,
      limit,
      total: initialQuotes.length,
      hasMore: false
    } : undefined,
    limit
  });

  // Function to handle "View all" button click
  const handleViewAll = () => {
    router.push("/featured");
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Featured Quotes</h2>
            <p className="text-muted-foreground">
              Discover today&apos;s most inspiring quotes
            </p>
          </div>
          <Button variant="ghost" disabled>View all</Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(limit)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-4 w-[60%]" />
                </div>
              </CardContent>
              <CardFooter className="border-t p-4">
                <div className="flex justify-between w-full">
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Featured Quotes</h2>
            <p className="text-muted-foreground">
              Discover today&apos;s most inspiring quotes
            </p>
          </div>
          <Button variant="ghost" onClick={handleViewAll}>View all</Button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h3 className="font-semibold">Failed to load featured quotes</h3>
            <p className="text-sm text-muted-foreground">
              {error || "Something went wrong. Please try again later."}
            </p>
          </div>
        </Card>
      </section>
    );
  }

  // No quotes found
  if (!quotes || quotes.length === 0) {
    return (
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Featured Quotes</h2>
            <p className="text-muted-foreground">
              Discover today&apos;s most inspiring quotes
            </p>
          </div>
          <Button variant="ghost" onClick={handleViewAll}>View all</Button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">No featured quotes available at the moment</p>
          </div>
        </Card>
      </section>
    );
  }

  // Success state with quotes
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Featured Quotes</h2>
          <p className="text-muted-foreground">
            Discover today&apos;s most inspiring quotes
          </p>
        </div>
        <Button variant="ghost" onClick={handleViewAll}>View all</Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((quote) => (
          <Card 
            key={quote.id}
            className={cn(
              "overflow-hidden",
              "transition-all duration-200",
              "hover:shadow-md",
              "group",
              "relative" // Add relative positioning for the featured badge
            )}
          >
            {/* Featured badge */}
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="default" className="bg-primary text-primary-foreground">
                <Star className="h-3 w-3 mr-1" /> Featured
              </Badge>
            </div>

            <CardHeader className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={quote.authorProfile?.image || ""} 
                    alt={quote.authorProfile.name} 
                  />
                  <AvatarFallback>
                    {quote.authorProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Link 
                    href={`/authors/${quote.authorProfile.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {quote.authorProfile.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    <Link href={`/categories/${quote.category.slug}`} className="hover:underline">
                      {quote.category.name}
                    </Link>
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Link href={`/quotes/${quote.slug}`}>
                <blockquote className="text-lg italic hover:text-primary transition-colors">
                  &quot;{quote.content}&quot;
                </blockquote>
              </Link>
            </CardContent>

            <CardFooter className="border-t p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:text-red-500 transition-colors"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {quote._count?.quoteLikes || 0}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {quote._count?.comments || 0}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/quotes/${quote.slug}`}>
                    <Share2 className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}