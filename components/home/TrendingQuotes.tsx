// components/home/TrendingQuotes.tsx
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

interface TrendingQuote {
  id: string;
  content: string;
  author: {
    name: string;
    image?: string;
    slug: string;
  };
  metrics: {
    likes: number;
    comments: number;
    shares: number;
  };
}

// Placeholder data - Replace with real data later
const trendingQuotes: TrendingQuote[] = [
  {
    id: "1",
    content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: {
      name: "Winston Churchill",
      slug: "winston-churchill",
      image: "/placeholders/churchill.jpg"
    },
    metrics: {
      likes: 1234,
      comments: 89,
      shares: 45
    }
  },
  // Add more quotes...
];

export function TrendingQuotes() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((current) => 
      current + 3 >= trendingQuotes.length ? 0 : current + 3
    );
  };

  const previous = () => {
    setCurrentIndex((current) => 
      current - 3 < 0 ? trendingQuotes.length - 3 : current - 3
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          <p className="text-sm text-muted-foreground">
            Most popular quotes this week
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={previous}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={next}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trendingQuotes.slice(currentIndex, currentIndex + 3).map((quote) => (
          <Card 
            key={quote.id}
            className={cn(
              "transition-all duration-200",
              "hover:shadow-md"
            )}
          >
            <CardContent className="p-6 space-y-4">
              <Link 
                href={`/authors/${quote.author.slug}`}
                className="flex items-center gap-2 group"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={quote.author.image} />
                  <AvatarFallback>
                    {quote.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium group-hover:text-primary">
                  {quote.author.name}
                </span>
              </Link>
              
              <blockquote className="italic text-muted-foreground">
                &quot;{quote.content}&quot;
              </blockquote>
            </CardContent>

            <CardFooter className="border-t p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:text-red-500"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {quote.metrics.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {quote.metrics.comments}
                  </Button>
                </div>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}