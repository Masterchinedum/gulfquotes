"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, AlertCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useFeaturedQuotes } from "@/hooks/use-featured-quotes";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { quoteTextUtils } from "@/lib/services/public-quote/utils/quote-text.utils";
import { quoteImageUtils } from "@/lib/services/public-quote/utils/quote-image.utils";

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

  // Header section - used in all states
  const HeaderSection = () => (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Featured Quotes</h2>
        <p className="text-muted-foreground">
          Discover today&apos;s most inspiring quotes
        </p>
      </div>
      <Button 
        variant="ghost" 
        onClick={handleViewAll} 
        disabled={isLoading || !!error || !quotes || quotes.length === 0}
      >
        View all
      </Button>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <section className="space-y-8">
        <HeaderSection />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="relative aspect-[16/10] rounded-lg overflow-hidden">
              <Skeleton className="absolute inset-0" />
              <div className="absolute inset-0 p-6 flex items-end">
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="space-y-8">
        <HeaderSection />
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
        <HeaderSection />
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
      <HeaderSection />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.slice(0, limit).map((quote) => {
          const textClass = quoteTextUtils.getTextClass(quote.content.length);
          const optimizedBgImage = quote.backgroundImage ? 
            quoteImageUtils.getOptimizedUrl(quote.backgroundImage, {
              aspectRatio: '16:10',
              quality: 90
            }) : null;
          
          return (
            <Link href={`/quotes/${quote.slug}`} key={quote.id} className="group/card">
              <div className={cn(
                "relative overflow-hidden rounded-lg",
                "aspect-[16/10]",
                "transition-all duration-300 ease-in-out",
                "hover:ring-2 hover:ring-primary/50 hover:shadow-xl",
                "bg-gradient-to-br from-card to-muted/80"
              )}>
                {/* Featured badge */}
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                    <Star className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                </div>

                {/* Background Image with Fade Effect */}
                {optimizedBgImage ? (
                  <div className="absolute inset-0">
                    <Image
                      src={optimizedBgImage}
                      alt={`Background for quote: ${quote.content.substring(0, 50)}...`}
                      fill
                      className={cn(
                        "object-cover",
                        "transition-transform duration-700 ease-out",
                        "group-hover/card:scale-105"
                      )}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className={cn(
                      "absolute inset-0",
                      "bg-gradient-to-t from-black/80 via-black/50 to-black/30",
                      "transition-opacity duration-300",
                      "group-hover/card:opacity-90"
                    )} />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                )}

                {/* Content Container */}
                <div className="relative h-full p-6 flex flex-col justify-between">
                  <div className={cn(
                    "text-center",
                    "transition-all duration-300",
                    "group-hover/card:transform group-hover/card:-translate-y-1",
                  )}>
                    <blockquote className={cn(
                      textClass,
                      "font-medium",
                      "text-white leading-relaxed",
                      "line-clamp-4",
                      "drop-shadow-md"
                    )}>
                      &ldquo;{quote.content}&rdquo;
                    </blockquote>
                  </div>
                  
                  {/* Author and meta info at bottom */}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 group/author">
                      <Avatar className={cn(
                        "h-8 w-8",
                        "ring-1 ring-white/50",
                        "transition-transform duration-300",
                        "group-hover/author:scale-105"
                      )}>
                        <AvatarImage src={quote.authorProfile?.image || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {quote.authorProfile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-white leading-none">
                          {quote.authorProfile.name}
                        </p>
                        <p className="text-xs text-white/70">
                          {quote.category.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="flex items-center gap-1 text-xs">
                        <Heart className="h-3.5 w-3.5" />
                        <span>{quote._count?.quoteLikes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}