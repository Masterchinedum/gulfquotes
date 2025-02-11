import { AuthorProfile } from "@prisma/client";

// Base API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

// Author Profile Specific Types
export type AuthorProfileResponse = ApiResponse<AuthorProfile>;
export type AuthorProfilesResponse = ApiResponse<PaginatedResponse<AuthorProfile>>;

// DTO Types
export interface AuthorProfileBase {
  name: string;
  bio: string;
  born?: string | null;
  died?: string | null;
  influences?: string | null;
  slug?: string;
  images: Array<{
    id: string;
    url: string;
  }>;
}

export interface AuthorProfileDto extends AuthorProfileBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  quotesCount?: number;
}