"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { quoteTextUtils } from "@/lib/services/public-quote/utils/quote-text.utils";
import { quoteImageUtils } from "@/lib/services/public-quote/utils/quote-image.utils";

interface QuoteCardProps {
  quote: {
    id: string;
    slug: string;
    content: string;
    backgroundImage: string | null;
    featured?: boolean; // Add this line
    author: {
      name: string;
      image?: string | null;
      slug: string;
    };
    category: {
      name: string;
      slug: string;
    };
  };
}

export function QuoteCard({ quote }: QuoteCardProps) {
  // Use text utils for font sizing
  const textClass = quoteTextUtils.getTextClass(quote.content.length);
  
  // Use image utils for background
  const optimizedBgImage = quote.backgroundImage ? 
    quoteImageUtils.getOptimizedUrl(quote.backgroundImage, {
      aspectRatio: '16:10',
      quality: 90
    }) : null;

  return (
    <div className="space-y-4 group/card">
      <Link href={`/quotes/${quote.slug}`}>
        <Card className={cn(
          "relative overflow-hidden",
          "aspect-[16/10]",
          "transition-all duration-300 ease-in-out",
          "hover:ring-2 hover:ring-primary/50 hover:shadow-xl",
          "bg-gradient-to-br from-card to-muted/80"
        )}>
          {/* Featured indicator */}
          {quote.featured && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                Featured
              </Badge>
            </div>
          )}
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
          <div className="relative h-full p-6 flex items-center justify-center">
            <div className={cn(
              "text-center",
              "w-[95%] max-h-[90%]", // Increased width and height
              "transition-all duration-300",
              "group-hover/card:transform group-hover/card:-translate-y-1",
              "overflow-y-auto scrollbar-hide" // Enable scrolling if needed
            )}>
              <blockquote className={cn(
                // Dynamic text sizing based on content length
                textClass,
                "font-medium",
                "text-white leading-relaxed",
                "line-clamp-none", // Remove line clamp
                "drop-shadow-md"
              )}>
                &ldquo;{quote.content}&rdquo;
              </blockquote>
            </div>
          </div>
        </Card>
      </Link>

      {/* Author and Category with Enhanced Layout */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 group/author">
          <Avatar className={cn(
            "h-10 w-10",
            "ring-2 ring-background",
            "transition-transform duration-300",
            "group-hover/author:scale-105"
          )}>
            <AvatarImage src={quote.author.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {quote.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Link 
              href={`/authors/${quote.author.slug}`} 
              className={cn(
                "text-sm font-medium leading-none",
                "hover:text-primary transition-colors"
              )}
            >
              {quote.author.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {quote.category.name}
            </p>
          </div>
        </div>

        <Link href={`/categories/${quote.category.slug}`}>
          <Badge variant="secondary" className={cn(
            "bg-muted/80 hover:bg-muted",
            "transition-all duration-300",
            "group-hover/card:bg-primary/10"
          )}>
            {quote.category.name}
          </Badge>
        </Link>
      </div>
    </div>
  );
}