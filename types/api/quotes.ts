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

// Request Parameter Types
export interface QuoteFilterParams {
  search?: string;
  authorId?: string;
  categoryId?: string;
  authorProfileId?: string;
}

export interface QuotePaginationParams {
  page?: number;
  limit?: number;
}

// Combine both for complete params type
export interface ListQuotesParams extends QuoteFilterParams, QuotePaginationParams {
  search?: string;
  authorId?: string;
  categoryId?: string;
  authorProfileId?: string;
  include?: {
    author?: boolean;
    category?: boolean;
    authorProfile?: boolean;
  };
}

// Add specific error codes type for better type safety
export type QuoteErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "DUPLICATE_SLUG"
  | "CONTENT_TOO_LONG";

// Enhanced ApiError with specific error codes
export interface QuoteApiError extends ApiError {
  code: QuoteErrorCode;
}

// Category Related Types
export type CategoryResponse = ApiResponse<Category>;
export type CategoriesResponse = ApiResponse<Category[]>;

