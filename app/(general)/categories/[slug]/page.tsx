// app/(general)/categories/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shells/shell";
import { CategoryHeader } from "@/components/categories/CategoryHeader";
import { CategoryQuotesList } from "@/components/categories/CategoryQuotesList";
import { CategoryPagination } from "@/components/categories/CategoryPagination";
import { categoryService } from "@/lib/services/category/category.service";
import { quoteCategoryService } from "@/lib/services/public-quote/quote-category.service";
import { auth } from "@/auth";
import { CategorySort } from "@/components/categories/CategorySort";

// Define search params interface first
interface CategorySearchParams {
  page?: string;
  sort?: string;
  limit?: string;
}

// Update the interface to match the pattern used in authors page
interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CategorySearchParams>;
}

export async function generateMetadata({ 
  params 
}: CategoryPageProps): Promise<Metadata> {
  // Await the params before using them
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  try {
    // Fetch category data for metadata
    const category = await categoryService.getCategoryBySlug(slug);
    
    return {
      title: `${category.name} Quotes | gulfquotes`,
      description: category.description || `Browse our collection of ${category.name} quotes`,
    };
  } catch (error) {
    // Log the error for debugging
    console.error("[CATEGORY_METADATA]", error);
    
    // Return fallback metadata
    return {
      title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Quotes | gulfquotes`,
      description: `Browse our collection of ${slug.replace(/-/g, ' ')} quotes`,
    };
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  // Await the params before using them
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  // Await searchParams before using them
  const resolvedSearchParams = await searchParams || {};
  
  // Parse search parameters
  const page = Number(resolvedSearchParams?.page) || 1;
  const sort = (resolvedSearchParams?.sort as "recent" | "popular" | "alphabetical") || "recent";
  const limit = Number(resolvedSearchParams?.limit) || 12;
  
  try {
    // Fetch the category data
    const category = await categoryService.getCategoryBySlug(slug);
    
    if (!category) {
      notFound();
    }
    
    // Get current user session if any (for likes/bookmarks)
    const session = await auth();
    const userId = session?.user?.id;
    
    // Fetch quotes for this category
    const quotesData = await quoteCategoryService.getQuotesByCategory({
      slug,
      page,
      limit,
      sortBy: sort,
      userId
    });
    
    // Calculate total pages for pagination
    const totalPages = Math.ceil(quotesData.total / limit);
    
    return (
      <Shell>
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Category Header */}
          <CategoryHeader category={category} />
          
          {/* Filter & Sort Controls */}
          <CategorySort 
            sort={sort}
            total={quotesData.total}
            count={quotesData.quotes.length}
          />
          
          {/* Quotes List */}
          <CategoryQuotesList 
            quotes={quotesData.quotes} 
            isLoading={false}
            emptyMessage={`No quotes found in the ${category.name} category`}
            categorySlug={category.slug}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <CategoryPagination 
              totalPages={totalPages} 
              currentPage={page}
              className="pt-4"
            />
          )}
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[CATEGORY_PAGE]", error);
    notFound();
  }
}