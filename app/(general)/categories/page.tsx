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

interface CategoryPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sortBy?: string;
    order?: string;
  };
}

export default async function CategoriesPage({ searchParams }: CategoryPageProps) {
  // Parse search parameters
  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "20", 10);
  const search = searchParams.search;
  const sortBy = (searchParams.sortBy as "name" | "popular" | "recent") || "name";
  const order = (searchParams.order as "asc" | "desc") || "asc";

  try {
    // Fetch categories and total count
    const categoriesData = await categoryService.getAllCategories({
      page,
      limit,
      search,
      sortBy,
      order,
    });

    // Get total categories count for the hero section
    const totalCategories = await categoryService.getTotalCategoriesCount();

    // Calculate total pages for pagination
    const totalPages = Math.ceil(categoriesData.total / limit);

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
            currentPage={page} 
            totalPages={totalPages} 
          />
          
          {/* Categories Grid */}
          <CategoryGrid 
            categories={categoriesData.items} 
            isLoading={false}
            emptyMessage={
              search 
                ? `No categories found for "${search}"`
                : "No categories found"
            }
          />
          
          {/* Pagination will be handled by the CategoriesFilter component */}
          
          {/* Show result count at bottom for better UX */}
          {categoriesData.total > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Showing {categoriesData.items.length} of {categoriesData.total} categories
              {search && (
                <> for &quot;<span className="font-medium">{search}</span>&quot;</>
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