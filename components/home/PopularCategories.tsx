// components/home/PopularCategories.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronRight, BarChart, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryWithMetrics } from "@/types/category";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export function PopularCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPopularCategories() {
      try {
        setIsLoading(true);
        // Explicitly request categories sorted by likes with the limit of 4
        const response = await fetch('/api/public/categories?sortBy=likes&order=desc&limit=4');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.data.items || []);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch popular categories:', error);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPopularCategories();
  }, []);

  if (isLoading) {
    return <PopularCategoriesSkeleton />;
  }

  if (error) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Popular Categories</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Most liked quote categories
            </p>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center gap-2 py-8">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Error Loading Categories</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {error}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="mt-2"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  // Find the maximum like count to calculate percentage for progress bars
  const maxLikes = Math.max(...categories.map(cat => cat.totalLikes || 0));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Popular Categories</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Most liked quote categories
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {categories.length === 0 ? (
          <Card className="col-span-full p-6">
            <div className="text-center py-10 text-muted-foreground">
              No categories found
            </div>
          </Card>
        ) : (
          categories.map((category) => {
            const likePercentage = maxLikes ? (category.totalLikes || 0) / maxLikes * 100 : 0;
            
            return (
              <Card
                key={category.slug}
                className={cn(
                  "overflow-hidden transition-all",
                  "hover:border-primary/50 hover:shadow-md group cursor-pointer"
                )}
                onClick={() => router.push(`/categories/${category.slug}`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {category._count.quotes} quotes
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Popularity</span>
                        <span className="font-medium flex items-center gap-1">
                          <BarChart className="h-3.5 w-3.5" />
                          {category.totalLikes.toLocaleString()} likes
                        </span>
                      </div>
                      <Progress 
                        value={likePercentage} 
                        className="h-2"
                        aria-label={`${category.name} has ${category.totalLikes} likes, which is ${Math.round(likePercentage)}% of the most popular category`}
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-end">
                  <Button variant="ghost" size="sm" className="text-xs h-8">
                    Browse category
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
      
      <div className="flex justify-center md:hidden pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/categories')}
        >
          View all categories
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-end">
              <Skeleton className="h-8 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}