import type { Category } from "@prisma/client";

// Base API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: CategoryApiError;
}

export interface ApiError {
  code: CategoryErrorCode;
  message: string;
  details?: Record<string, string[]>;
}

// Category specific error codes
export type CategoryErrorCode = 
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "DUPLICATE_SLUG"
  | "DUPLICATE_CATEGORY"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "CATEGORY_IN_USE";  // Add this new error code

// Category specific API error
export interface CategoryApiError extends ApiError {
  code: CategoryErrorCode;
}

// Category list data with pagination
export interface CategoriesListData {
  items: Category[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

// API Response Types
export type CategoryResponse = ApiResponse<Category>;
export type CategoriesResponse = ApiResponse<CategoriesListData>;

// Request Parameter Types
export interface CategoryFilterParams {
  search?: string;
  orderBy?: "name" | "createdAt";
  order?: "asc" | "desc";
}

export interface CategoryPaginationParams {
  page?: number;
  limit?: number;
}

// Combined params type
export interface ListCategoriesParams extends CategoryFilterParams, CategoryPaginationParams {}