// components/categories/CategoriesHero.tsx
"use client";

import { cn } from "@/lib/utils";
import { BookMarked, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface CategoriesHeroProps {
  totalCategories?: number;
  className?: string;
}

export function CategoriesHero({ 
  totalCategories = 0,
  className 
}: CategoriesHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new query parameters
    const params = new URLSearchParams(searchParams);
    
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    
    // Reset to first page when searching
    params.delete("page");
    
    // Navigate to the same page but with updated query params
    router.push(`/categories?${params.toString()}`);
  };
  
  // Update search input when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  return (
    <section className={cn(
      "w-full py-12 md:py-24 lg:py-32",
      "bg-gradient-to-b from-background to-muted/30",
      "border-b",
      className
    )}>
      <div className="container max-w-5xl mx-auto px-4 space-y-10 text-center">
        {/* Hero Content */}
        <div className="space-y-4">
          <div className="inline-block p-2 bg-muted rounded-full mb-4">
            <BookMarked className="h-6 w-6 text-primary" />
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Browse Categories
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Discover quotes organized by themes and topics that inspire, motivate, and enlighten.
            {totalCategories > 0 && (
              <span className="font-medium"> Explore our collection of {totalCategories} categories.</span>
            )}
          </p>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search categories..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <BookMarked className="inline-block h-4 w-4 mr-1" />
            {totalCategories} Categories
          </span>
        </div>
      </div>
    </section>
  );
}

// Server-side version for use in Server Components
export function CategoriesHeroServer({ 
  totalCategories = 0,
  className 
}: CategoriesHeroProps) {
  return (
    <section className={cn(
      "w-full py-12 md:py-24 lg:py-32",
      "bg-gradient-to-b from-background to-muted/30",
      "border-b",
      className
    )}>
      <div className="container max-w-5xl mx-auto px-4 space-y-6 text-center">
        <div className="inline-block p-2 bg-muted rounded-full mb-4">
          <BookMarked className="h-6 w-6 text-primary" />
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Browse Categories
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Discover quotes organized by themes and topics that inspire, motivate, and enlighten.
          {totalCategories > 0 && (
            <span className="font-medium"> Explore our collection of {totalCategories} categories.</span>
          )}
        </p>
        
        {/* Server-side note: Search functionality will be handled by the client component */}
      </div>
    </section>
  );
}