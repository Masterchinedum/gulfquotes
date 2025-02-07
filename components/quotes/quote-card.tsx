"use client";

import { Quote, User, Category } from "@prisma/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuoteCardProps {
  quote: Quote & {
    author: User;
    category: Category;
  };
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      "hover:shadow-lg hover:scale-[1.02]",
      "group cursor-pointer"
    )}>
      <CardContent className={cn(
        "p-6 space-y-4",
        "transition-colors duration-200",
        "group-hover:bg-muted/50"
      )}>
        <blockquote className={cn(
          "text-xl italic text-muted-foreground",
          "line-clamp-4 sm:line-clamp-none",
          "break-words"
        )}>
          &quot;{quote.content}&quot;
        </blockquote>
      </CardContent>
      <CardFooter className={cn(
        "bg-muted/50 p-6",
        "flex items-center justify-between",
        "flex-col sm:flex-row gap-4",
        "border-t"
      )}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Avatar className="h-8 w-8 border shadow-sm">
            <AvatarImage 
              src={quote.author.image || ""} 
              alt={quote.author.name || ""} 
            />
            <AvatarFallback className="bg-primary/10">
              {quote.author.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium line-clamp-1">
              {quote.author.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(quote.createdAt)}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="w-full sm:w-auto justify-center">
          {quote.category.name}
        </Badge>
      </CardFooter>
    </Card>
  );
}