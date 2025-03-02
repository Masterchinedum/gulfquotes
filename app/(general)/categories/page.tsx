// app/(general)/categories/page.tsx
import { Metadata } from "next";
import { Shell } from "@/components/shells/shell";
import { CategoriesHeroServer } from "@/components/categories/CategoriesHero";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
import { CategoriesFilter } from "@/components/categories/CategoriesFilter";
import { categoryService } from "@/lib/services/category/category.service";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Browse Categories | Quoticon",
  description: "Explore our collection of quotes by category",
};

// Custom search params interface to avoid clashing with Next.js types
interface CustomSearchParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  order?: string;
}

interface CategoryPageProps {
  searchParams: Promise<CustomSearchParams>;
}

export default async function CategoriesPage({ searchParams }: CategoryPageProps) {
  // Await the searchParams promise before using it
  const params = {
    page: parseInt((await searchParams)?.page || "1", 10),
    limit: parseInt((await searchParams)?.limit || "20", 10),
    search: (await searchParams)?.search,
    sortBy: ((await searchParams)?.sortBy as "name" | "popular" | "recent") || "name",
    order: ((await searchParams)?.order as "asc" | "desc") || "asc"
  };

  try {
    // Fetch categories and total count
    const categoriesData = await categoryService.getAllCategories({
      page: params.page,
      limit: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      order: params.order,
    });

    // Get total categories count for the hero section
    const totalCategories = await categoryService.getTotalCategoriesCount();

    // Calculate total pages for pagination
    const totalPages = Math.ceil(categoriesData.total / params.limit);

    return (
      <Shell>
        {/* Hero Section */}
        <CategoriesHeroServer 
          totalCategories={totalCategories}
        />
        
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
          {/* Filters and Sorting */}
          <CategoriesFilter 
            totalItems={categoriesData.total} 
            currentPage={params.page} 
            totalPages={totalPages} 
          />
          
          {/* Categories Grid */}
          <CategoryGrid 
            categories={categoriesData.items} 
            isLoading={false}
            emptyMessage={
              params.search 
                ? `No categories found for "${params.search}"`
                : "No categories found"
            }
          />
          
          {/* Show result count at bottom for better UX */}
          {categoriesData.total > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Showing {categoriesData.items.length} of {categoriesData.total} categories
              {params.search && (
                <> for &quot;<span className="font-medium">{params.search}</span>&quot;</>
              )}
            </div>
          )}
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("Error loading categories:", error);
    notFound();
  }
}