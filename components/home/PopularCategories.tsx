// components/home/PopularCategories.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  Lightbulb, 
  Target, 
  Trophy, 
  Heart, 
  Book, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  slug: string;
  icon: keyof typeof categoryIcons;
  count: number;
}

const categoryIcons = {
  Motivation: Lightbulb,
  Success: Trophy,
  Leadership: Target,
  Love: Heart,
  Wisdom: Book,
  Inspiration: Sparkles,
};

const popularCategories: Category[] = [
  { name: "Motivation", slug: "motivation", icon: "Motivation", count: 234 },
  { name: "Success", slug: "success", icon: "Success", count: 189 },
  { name: "Leadership", slug: "leadership", icon: "Leadership", count: 156 },
  { name: "Love", slug: "love", icon: "Love", count: 145 },
  { name: "Wisdom", slug: "wisdom", icon: "Wisdom", count: 134 },
  { name: "Inspiration", slug: "inspiration", icon: "Inspiration", count: 123 },
];

export function PopularCategories() {
  const router = useRouter();

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
        {popularCategories.map((category) => {
          const Icon = categoryIcons[category.icon];
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
                    {category.count} quotes
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