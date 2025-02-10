import { Quote, Category } from "@prisma/client";

// Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

// Quote Specific Types
export type QuoteResponse = ApiResponse<Quote>;
export type CreateQuoteResponse = ApiResponse<Quote>;

export interface QuotesResponseData {
  items: Quote[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
  filters: {
    search: string | null;
    authorId: string | null;
    categoryId: string | null;
    authorProfileId: string | null;
  };
}

export type QuotesResponse = ApiResponse<QuotesResponseData>;

// Category Related Types
export type CategoryResponse = ApiResponse<Category>;
export type CategoriesResponse = ApiResponse<Category[]>;

