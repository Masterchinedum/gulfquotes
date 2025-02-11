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
export interface AuthorProfileDto {
  id: string;
  name: string;
  born?: string | null;
  died?: string | null;
  influences?: string | null;
  bio: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  quotesCount?: number;
  images: {
    id: string;
    url: string;
  }[];
}