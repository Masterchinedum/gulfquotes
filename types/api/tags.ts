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
export type TagsResponse = ApiResponse<TagsListData>;
export type TagResponse = ApiResponse<Tag>;

// Error Codes
export type TagErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "DUPLICATE_TAG"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";