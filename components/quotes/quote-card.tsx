"use client";

import { Quote, User, Category } from "@prisma/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

interface QuoteCardProps {
  quote: Quote & {
    author: User;
    category: Category;
  };
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <blockquote className="text-xl italic text-muted-foreground">
          &quot;{quote.content}&quot;
        </blockquote>
      </CardContent>
      <CardFooter className="bg-muted/50 p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={quote.author.image || ""} alt={quote.author.name || ""} />
            <AvatarFallback>{quote.author.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{quote.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(quote.createdAt)}
            </span>
          </div>
        </div>
        <Badge variant="secondary">{quote.category.name}</Badge>
      </CardFooter>
    </Card>
  );
}