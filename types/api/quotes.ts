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
  categoryId?: string;
  authorProfileId?: string;
}

export interface QuotePaginationParams {
  page?: number;
  limit?: number;
}

// Combine both for complete params type
export interface ListQuotesParams extends QuoteFilterParams, QuotePaginationParams {}

export type QuoteErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "DUPLICATE_SLUG"
  | "CONTENT_TOO_LONG"
  | "CONCURRENT_MODIFICATION"
  | "CONCURRENT_DELETE"
  | "BAD_REQUEST";  // Add this

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

