// components/home/PopularCategories.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  Lightbulb, Target, Trophy, Heart, Book, Sparkles, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryWithQuoteCount } from "@/types/category";

const categoryIcons = {
  Motivation: Lightbulb,
  Success: Trophy,
  Leadership: Target,
  Love: Heart,
  Wisdom: Book,
  Inspiration: Sparkles,
  Default: Sparkles, // Fallback icon
};

export function PopularCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithQuoteCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPopularCategories() {
      try {
        const response = await fetch('/api/public/categories?sortBy=popular&limit=6');
        const data = await response.json();
        setCategories(data.data.items || []);
      } catch (error) {
        console.error('Failed to fetch popular categories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPopularCategories();
  }, []);

  if (isLoading) {
    return <PopularCategoriesSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Popular Categories</h2>
          <p className="text-sm text-muted-foreground">
            Browse quotes by your favorite topics
          </p>
        </div>
        <Button 
          variant="ghost" 
          className="hidden sm:flex"
          onClick={() => router.push('/categories')}
        >
          View all
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => {
          // Get icon or fallback to default
          const Icon = categoryIcons[category.name as keyof typeof categoryIcons] || categoryIcons.Default;
          
          return (
            <Card
              key={category.slug}
              className={cn(
                "group cursor-pointer transition-all",
                "hover:border-primary/50 hover:shadow-sm"
              )}
              onClick={() => router.push(`/categories/${category.slug}`)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-center">
                  <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category._count.quotes} quotes
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function PopularCategoriesSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-center">
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 mx-auto bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 mx-auto bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}