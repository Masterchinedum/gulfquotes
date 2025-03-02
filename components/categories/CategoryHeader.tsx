// components/categories/CategoryHeader.tsx
import { BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CategoryWithQuoteCount } from "@/types/category";

interface CategoryHeaderProps {
  category: CategoryWithQuoteCount;
  className?: string;
}

export function CategoryHeader({ category, className }: CategoryHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      {/* Back link */}
      <div>
        <Button variant="link" asChild className="pl-0">
          <Link href="/categories">
            &larr; All Categories
          </Link>
        </Button>
      </div>
      
      {/* Main header content */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <BookMarked className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
          </div>
          
          {category.description && (
            <p className="text-muted-foreground max-w-2xl">
              {category.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {category._count.quotes} {category._count.quotes === 1 ? "quote" : "quotes"}
          </Badge>
        </div>
      </div>
      
      <div className="border-b pt-2" />
    </header>
  );
}