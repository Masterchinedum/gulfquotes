// app/(general)/categories/[slug]/page.tsx
import { Metadata } from "next";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { notFound } from "next/navigation";
import { Shell } from "@/components/shells/shell";

// Define search params interface first
interface CategorySearchParams {
  page?: string;
  sort?: string;
}

// Update the interface to match the pattern used in authors page
interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CategorySearchParams>; // Changed to Promise
}

export async function generateMetadata({ 
  params 
}: CategoryPageProps): Promise<Metadata> {
  // Await the params before using them
  const resolvedParams = await params;
  
  return {
    title: `${resolvedParams.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Quotes | Quoticon`,
    description: `Browse our collection of ${resolvedParams.slug.replace(/-/g, ' ')} quotes`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  // Await the params before using them
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  // Await searchParams before using them
  const resolvedSearchParams = await searchParams || {};
  
  // These variables will be used when implementing data fetching
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const page = Number(resolvedSearchParams?.page) || 1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sort = resolvedSearchParams?.sort || "recent";
  
  // Example of how notFound would be used (uncomment when implementing data fetching)
  // try {
  //   const category = await categoryService.getCategoryBySlug(slug);
  //   if (!category) {
  //     notFound();
  //   }
  //   // rest of your code
  // } catch (error) {
  //   console.error("[CATEGORY_PAGE]", error);
  //   notFound();
  // }
  
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
}