// types/api/tags.ts

import { Tag } from "@prisma/client";

// Base API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: TagErrorCode;
  message: string;
  details?: Record<string, string[]>;
}

// Tag specific types
export interface TagData extends Tag {
  quoteCount?: number;
}

export interface TagsListData {
  items: TagData[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

// API Response Types
export type TagResponse = ApiResponse<TagData>;
export type TagsResponse = ApiResponse<TagsListData>;

// Request Parameter Types
export interface TagFilterParams {
  search?: string;
  orderBy?: TagSortField;
  order?: SortOrder;
}

export interface TagPaginationParams {
  page?: number;
  limit?: number;
}

// Combined params type
export interface ListTagsParams extends TagFilterParams, TagPaginationParams {}

// Error Codes
export type TagErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "DUPLICATE_TAG"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST";

// Sort options
export type TagSortField = "name" | "createdAt" | "quoteCount";
export type SortOrder = "asc" | "desc";

// Tag operation types
export interface AddTagsToQuoteInput {
  tagIds: string[];
}

export interface RemoveTagsFromQuoteInput {
  tagIds: string[];
}