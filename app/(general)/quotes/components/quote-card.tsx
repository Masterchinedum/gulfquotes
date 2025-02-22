"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuoteCardProps {
  quote: {
    id: string;
    slug: string;
    content: string;
    backgroundImage: string | null;
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
  return (
    <div className="space-y-4">
      <Link href={`/quotes/${quote.slug}`}>
        <Card className={cn(
          "group relative overflow-hidden",
          "aspect-[1.91/1]", // Fixed aspect ratio
          "transition-all duration-300",
          "hover:ring-2 hover:ring-primary/50 hover:shadow-lg"
        )}>
          {/* Background Image */}
          {quote.backgroundImage ? (
            <Image
              src={quote.backgroundImage}
              alt={`Background for quote: ${quote.content.substring(0, 50)}...`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
          )}

          {/* Overlay */}
          <div className={cn(
            "absolute inset-0",
            "bg-black/20", // Reduced blur effect
            "transition-opacity duration-300",
            "group-hover:bg-black/30"
          )} />

          {/* Content Container */}
          <div className="relative h-full p-6 flex items-center justify-center">
            {/* Quote Text */}
            <div className="text-center max-w-[80%]">
              <blockquote className={cn(
                "text-lg md:text-xl font-medium",
                "text-white leading-relaxed",
                "line-clamp-4"
              )}>
                &ldquo;{quote.content}&rdquo;
              </blockquote>
            </div>
          </div>
        </Card>
      </Link>

      {/* Author and Category */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-white/20">
            <AvatarImage src={quote.author.image || ""} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {quote.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-muted-foreground">
            <p className="text-sm font-medium leading-none">
              {quote.author.name}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-muted/10 hover:bg-muted/20">
          {quote.category.name}
        </Badge>
      </div>
    </div>
  );
}