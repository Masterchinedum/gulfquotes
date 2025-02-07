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

// Quote Specific Types
export type QuoteResponse = ApiResponse<Quote>;
export type QuotesResponse = ApiResponse<Quote[]>;
export type CreateQuoteResponse = ApiResponse<Quote>;

// Category Related Types
export type CategoryResponse = ApiResponse<Category>;
export type CategoriesResponse = ApiResponse<Category[]>;