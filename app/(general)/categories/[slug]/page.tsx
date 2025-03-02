// app/(general)/categories/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shells/shell";

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
    sort?: string;
  };
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  // We'll implement this properly in a later phase
  return {
    title: `${params.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Quotes | Quoticon`,
    description: `Browse our collection of ${params.slug.replace(/-/g, ' ')} quotes`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = params;
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || "recent";
  
  // Data fetching will be implemented in the next phase
  
  return (
    <Shell>
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight capitalize">
            {slug.replace(/-/g, " ")} Quotes
          </h1>
          <p className="text-muted-foreground">
            Discover inspiring {slug.replace(/-/g, " ")} quotes from our collection
          </p>
        </div>
        
        {/* Filter & Sort Controls Placeholder */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing quotes in this category</p>
        </div>
        
        {/* Quote Grid Placeholder */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Quote cards will be rendered here */}
          <div className="h-48 rounded-lg border bg-card text-card-foreground shadow flex items-center justify-center">
            <p className="text-muted-foreground">Quotes loading...</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}\