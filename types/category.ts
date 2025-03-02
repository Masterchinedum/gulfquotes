// types/category.ts
import type { Category as PrismaCategory } from "@prisma/client";

export type Category = PrismaCategory;

export interface CategoryWithQuoteCount extends Category {
  _count: {
    quotes: number;
  };
}

export interface CategoryApiResponse {
  data?: Category;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * API response for a paginated list of categories
 */
export interface CategoriesApiResponse {
  data?: {
    items: CategoryWithQuoteCount[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Parameters for fetching categories
 */
export interface ListCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "popular" | "recent";
  order?: "asc" | "desc";
}

/**
 * Parameters for fetching quotes by category
 */
export interface CategoryQuotesParams {
  slug: string;
  page?: number;
  limit?: number;
  sortBy?: "recent" | "popular" | "alphabetical";
}