"use client";

import { useState } from "react";
import { Quote, User, Category } from "@prisma/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

interface QuoteCardProps {
  quote: Quote & { author: User; category: Category };
}

export function QuoteCard({ quote }: QuoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete quote");
      // Optionally, trigger a refresh or display a success message here.
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-transform duration-200",
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
        "flex flex-col sm:flex-row items-center gap-4",
        "border-t"
      )}>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border shadow-sm">
            <AvatarImage src={quote.author.image || ""} alt={quote.author.name || ""} />
            <AvatarFallback className="bg-primary/10">
              {quote.author.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium line-clamp-1">{quote.author.name}</span>
            <span className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</span>
          </div>
        </div>
        <Badge variant="secondary">{quote.category.name}</Badge>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Link href={`/manage/quotes/edit/${quote.id}`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Icons.spinner className="animate-spin h-4 w-4" /> : "Delete"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}