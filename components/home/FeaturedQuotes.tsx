"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useFeaturedQuotes } from "@/hooks/use-featured-quotes";
// import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { quoteTextUtils } from "@/lib/services/public-quote/utils/quote-text.utils";
import { quoteImageUtils } from "@/lib/services/public-quote/utils/quote-image.utils";
// Import the shared components for interaction
import { QuoteLikeButton } from "@/components/shared/QuoteLikeButton";
import { QuoteCommentButton } from "@/components/shared/QuoteCommentButton";
import { QuoteShareButton } from "@/components/shared/QuoteShareButton";

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

  // Header section stays the same
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

  // Loading, error, and empty states remain the same...

  // Success state with quotes - updated to match TrendingQuotes interaction pattern
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
            <Card 
              key={quote.id}
              className={cn(
                "transition-all duration-200",
                "hover:shadow-md",
                "overflow-hidden"
              )}
            >
              <div className="relative">
                {/* Featured badge */}
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                    <Star className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                </div>

                {/* Background Image with Fade Effect */}
                <div className="aspect-[16/10] relative overflow-hidden">
                  {optimizedBgImage ? (
                    <>
                      <Image
                        src={optimizedBgImage}
                        alt={`Background for quote: ${quote.content.substring(0, 50)}...`}
                        fill
                        className={cn(
                          "object-cover",
                          "transition-transform duration-700 ease-out",
                          "group-hover:scale-105"
                        )}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className={cn(
                        "absolute inset-0",
                        "bg-gradient-to-t from-black/80 via-black/50 to-black/30"
                      )} />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                  )}

                  {/* Content Container */}
                  <div className="relative h-full p-6 flex flex-col justify-between">
                    <div className="text-center">
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
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <Link 
                  href={`/authors/${quote.authorProfile.slug}`}
                  className="flex items-center gap-2 group"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={quote.authorProfile.image || ""} 
                      alt={quote.authorProfile.name}
                    />
                    <AvatarFallback>
                      {quote.authorProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium group-hover:text-primary">
                      {quote.authorProfile.name}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {quote.category.name}
                    </p>
                  </div>
                </Link>
              </CardContent>

              <CardFooter className="border-t p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex gap-4">
                    <QuoteLikeButton
                      initialLikes={quote._count?.quoteLikes || 0}
                      quoteId={quote.slug}
                      className="hover:text-red-500"
                    />
                    
                    <QuoteCommentButton
                      quoteSlug={quote.slug}
                      commentCount={quote._count?.comments || 0}
                    />
                  </div>
                  
                  <QuoteShareButton
                    quoteSlug={quote.slug}
                    quoteContent={quote.content}
                    authorName={quote.authorProfile.name}
                  />
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}