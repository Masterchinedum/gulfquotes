// components/categories/CategoryCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CategoryWithQuoteCount } from "@/types/category";

interface CategoryCardProps {
  category: CategoryWithQuoteCount;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <Card 
        className={cn(
          "h-full overflow-hidden transition-all duration-200",
          "hover:shadow-md hover:border-primary/50",
          className
        )}
      >
        <CardContent className="p-6 flex flex-col h-full justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">{category.name}</h3>
              <div className="text-muted-foreground">
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            
            {category.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {category._count.quotes} {category._count.quotes === 1 ? "quote" : "quotes"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Add a Skeleton component for loading state
CategoryCard.Skeleton = function CategoryCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded-full animate-pulse mt-2" />
        </div>
      </CardContent>
    </Card>
  );
};