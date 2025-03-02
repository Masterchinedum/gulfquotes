// app/(general)/categories/page.tsx
import { Metadata } from "next";
import { Shell } from "@/components/shells/shell";

export const metadata: Metadata = {
  title: "Browse Categories | Quoticon",
  description: "Explore our collection of quotes by category",
};

export default async function CategoriesPage() {
  // We'll implement data fetching in the next phase
  
  return (
    <Shell>
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Browse quotes by categories that interest you
          </p>
        </div>
        
        {/* Categories Grid - Placeholder */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* Category cards will be rendered here */}
          <div className="h-40 rounded-lg border bg-card text-card-foreground shadow flex items-center justify-center">
            <p className="text-muted-foreground">Categories loading...</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}