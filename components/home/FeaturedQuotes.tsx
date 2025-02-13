// components/home/FeaturedQuotes.tsx
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FeaturedQuote {
  id: string;
  content: string;
  author: {
    name: string;
    image?: string;
    slug: string;
  };
  likes: number;
  comments: number;
}

interface FeaturedQuotesProps {
  quotes?: FeaturedQuote[];
}

// Placeholder data - Remove this when implementing real data
const placeholderQuotes: FeaturedQuote[] = [
  {
    id: "1",
    content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: {
      name: "Winston Churchill",
      slug: "winston-churchill",
      image: "/placeholders/churchill.jpg"
    },
    likes: 1234,
    comments: 89
  },
  // Add more placeholder quotes...
];

export function FeaturedQuotes({ quotes = placeholderQuotes }: FeaturedQuotesProps) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Featured Quotes</h2>
          <p className="text-muted-foreground">
            Discover today&apos;s most inspiring quotes
          </p>
        </div>
        <Button variant="ghost">View all</Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((quote) => (
          <Card 
            key={quote.id}
            className={cn(
              "overflow-hidden",
              "transition-all duration-200",
              "hover:shadow-md",
              "group"
            )}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={quote.author.image} alt={quote.author.name} />
                  <AvatarFallback>
                    {quote.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Link 
                    href={`/authors/${quote.author.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {quote.author.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">Featured Quote</p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <blockquote className="text-lg italic">
                &quot;{quote.content}&quot;
              </blockquote>
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
                    {quote.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {quote.comments}
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