// components/categories/CategoryGrid.tsx
import { CategoryCard } from "./CategoryCard";
import { cn } from "@/lib/utils";
import type { CategoryWithQuoteCount } from "@/types/category";

interface CategoryGridProps {
  categories: CategoryWithQuoteCount[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function CategoryGrid({ 
  categories, 
  isLoading = false, 
  emptyMessage = "No categories found",
  className 
}: CategoryGridProps) {
  
  // Show loading skeletons
  if (isLoading) {
    return (
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}>
        {Array.from({ length: 8 }).map((_, i) => (
          <CategoryCard.Skeleton key={i} />
        ))}
      </div>
    );
  }
  
  // Show empty state message
  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-center">
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  // Show categories grid
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
      className
    )}>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}