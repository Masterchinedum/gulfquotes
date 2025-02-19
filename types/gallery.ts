// types/gallery.ts
import { Gallery } from "@prisma/client";
import { BaseErrorCode, AppErrorCode } from "./api/quotes"; // Add AppErrorCode import

// Step 1: Base Types
export interface GalleryItem extends Gallery {
  _count?: {
    quotes: number;
  };
}

// Base Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: GalleryApiError;
}

// Gallery Error Codes extending base error codes
export type GalleryErrorCode = 
  | BaseErrorCode  // Reuse common error codes
  | "GALLERY_DUPLICATE_IMAGE"
  | "GALLERY_IMAGE_DELETE_FAILED"
  | "GALLERY_CLOUDINARY_ERROR"
  | "GALLERY_NOT_FOUND"
  | "GALLERY_ALREADY_EXISTS"
  | "GALLERY_CREATION_FAILED"
  | "GALLERY_UPDATE_FAILED"
  | "GALLERY_DELETE_FAILED"
  | "GALLERY_FETCH_FAILED"
  | "GALLERY_QUOTE_OPERATION_FAILED";

// Gallery-specific ApiError type
export interface GalleryApiError {
  code: AppErrorCode; // Changed from GalleryErrorCode to AppErrorCode
  message: string;
  details?: Record<string, string[]>;
}

// Gallery Response Types
export type GalleryResponse = ApiResponse<GalleryItem>;
export type GalleryListResponse = ApiResponse<{
  items: GalleryItem[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}>;
export type GalleryDeleteResponse = ApiResponse<null>;

// Input Types (unchanged)
export interface GalleryCreateInput {
  url: string;
  publicId: string;
  title?: string;
  description?: string;
  altText?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  isGlobal?: boolean;
}

export interface GalleryUpdateInput {
  title?: string;
  description?: string;
  altText?: string;
  isGlobal?: boolean;
}

// Query Options Types (unchanged)
export interface GalleryFilterOptions {
  search?: string;
  isGlobal?: boolean;
  minUsageCount?: number;
  maxUsageCount?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  formats?: string[];
}

export type GallerySortField = 
  | "createdAt"
  | "updatedAt"
  | "title"
  | "usageCount";

export type SortDirection = "asc" | "desc";

export interface GallerySortOptions {
  field: GallerySortField;
  direction: SortDirection;
}

export interface GalleryListOptions {
  page?: number;
  limit?: number;
  sort?: GallerySortOptions;
  filter?: GalleryFilterOptions;
}