import type { Quote, Category, AuthorProfile } from "@prisma/client";
import type { UpdateQuoteInput } from "@/schemas/quote";

// Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: QuoteErrorCode;
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
export type UpdateQuoteResponse = ApiResponse<Quote>;

export interface QuotesResponseData {
  data: Array<Quote & {
    category: Category;
    authorProfile: AuthorProfile;
  }>;
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
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

// Add include options for relationships
export interface QuoteIncludeParams {
  include?: {
    author?: boolean;
    category?: boolean;
    authorProfile?: boolean;
  };
}

// Combine all params types
export interface ListQuotesParams extends 
  QuoteFilterParams, 
  QuotePaginationParams,
  QuoteIncludeParams {}

// Base error codes that can be shared across different features
export type BaseErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "DATABASE_ERROR";  // Add this to base error codes

// Category specific error codes
export type CategoryErrorCode =
  | BaseErrorCode
  | "CATEGORY_NOT_FOUND"
  | "DUPLICATE_CATEGORY"
  | "INVALID_CATEGORY_DATA";

// Quote specific error codes
export type QuoteErrorCode = 
  | BaseErrorCode
  | "DUPLICATE_SLUG"
  | "CONTENT_TOO_LONG"
  | "CONCURRENT_MODIFICATION"
  | "CONCURRENT_DELETE"
  | "QUOTE_ACCESS_DENIED"
  | "NO_CHANGES"
  | "CATEGORY_NOT_FOUND"
  | "INVALID_REFERENCE";  // Add this error code

// Author Profile specific error codes
export type AuthorProfileErrorCode =
  | BaseErrorCode
  | "AUTHOR_PROFILE_NOT_FOUND"
  | "DUPLICATE_AUTHOR_PROFILE"
  | "INVALID_AUTHOR_PROFILE_DATA"
  | "AUTHOR_PROFILE_VALIDATION";

// Combined error code type for the AppError class
export type AppErrorCode = QuoteErrorCode | AuthorProfileErrorCode | CategoryErrorCode;

export interface QuoteApiError extends ApiError {
  code: QuoteErrorCode;
}

export interface UpdateQuoteParams {
  slug: string;           // For identifying the quote
  data: UpdateQuoteInput; // The data to update
  include?: {
    author?: boolean;
    category?: boolean;
    authorProfile?: boolean;
  };
}

// Category Related Types
export type CategoryResponse = ApiResponse<Category>;
export type CategoriesResponse = ApiResponse<Category[]>;

