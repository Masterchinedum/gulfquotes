import type { Quote, Category, AuthorProfile } from "@prisma/client";
import type { QuoteImageData, SortOption } from "@/lib/services/quote/types";

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
  QuoteIncludeParams {
  sortBy?: SortOption; // Add sortBy property
}

// Base error codes that can be shared across different features
export type BaseErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "DATABASE_ERROR"
  | "INVALID_REFERENCE";  // Add this error code

// Category specific error codes
export type CategoryErrorCode =
  | BaseErrorCode
  | "CATEGORY_NOT_FOUND"
  | "DUPLICATE_CATEGORY"
  | "INVALID_CATEGORY_DATA"
  | "CATEGORY_IN_USE";  // Add this line

// Add new image-specific error codes
export type ImageErrorCode =
  | "MAX_IMAGES_EXCEEDED"
  | "INVALID_IMAGE_FORMAT"
  | "INVALID_IMAGE_SIZE"
  | "INVALID_IMAGE_DIMENSIONS"
  | "IMAGE_UPLOAD_FAILED"
  | "IMAGE_DELETE_FAILED"
  | "IMAGE_NOT_FOUND"
  | "IMAGE_ASSOCIATION_REMOVE_FAILED"; // Add this

// Quote specific error codes
export type QuoteErrorCode = 
  | BaseErrorCode
  | ImageErrorCode
  | "DUPLICATE_SLUG"
  | "CONTENT_TOO_LONG"
  | "CONCURRENT_MODIFICATION"
  | "CONCURRENT_DELETE" 
  | "QUOTE_ACCESS_DENIED"
  | "NO_CHANGES"
  | "CATEGORY_NOT_FOUND"
  | "AUTHOR_PROFILE_NOT_FOUND"
  | "INVALID_IMAGE"                    // Add this
  | "INVALID_IMAGE_FORMAT"             // Add this
  | "INVALID_IMAGE_SIZE"               // Add this
  | "INVALID_IMAGE_DIMENSIONS"         // Add this
  | "MAX_IMAGES_EXCEEDED"              // Add this
  | "IMAGE_UPLOAD_FAILED"              // Add this
  | "IMAGE_DELETE_FAILED"              // Add this
  | "IMAGE_NOT_FOUND"                  // Add this
  | "IMAGE_ASSOCIATION_FAILED"         // Add this
  | "IMAGE_DISSOCIATION_FAILED"        // Add this
  | "GALLERY_QUOTE_OPERATION_FAILED"   // Add this
  | "UPDATE_FAILED" 
  | "GALLERY_IN_USE";                  // Add this

// Author Profile specific error codes
export type AuthorProfileErrorCode =
  | BaseErrorCode
  | "AUTHOR_PROFILE_NOT_FOUND"
  | "DUPLICATE_AUTHOR_PROFILE"
  | "INVALID_AUTHOR_PROFILE_DATA"
  | "AUTHOR_PROFILE_VALIDATION"
  | "IMAGE_UPLOAD_ERROR"  
  | "IMAGE_DELETE_ERROR"   
  | "MAX_IMAGES_EXCEEDED" 
  | "INVALID_IMAGE";  

// Combined error code type for the AppError class
export type AppErrorCode = 
  | "FETCH_IMAGES_FAILED"
  | "UPDATE_METADATA_FAILED"
  | "DELETE_IMAGE_FAILED"
  | "IMAGE_ASSOCIATION_FAILED"
  | "IMAGE_DISSOCIATION_FAILED"
  | "GALLERY_DUPLICATE_IMAGE"
  | "GALLERY_IMAGE_DELETE_FAILED"
  | "GALLERY_CLOUDINARY_ERROR"
  | "GALLERY_NOT_FOUND"
  | "GALLERY_ALREADY_EXISTS"
  | "GALLERY_CREATION_FAILED"
  | "GALLERY_UPDATE_FAILED"
  | "GALLERY_DELETE_FAILED"
  | "GALLERY_FETCH_FAILED"
  | "GALLERY_QUOTE_OPERATION_FAILED"
  | "GALLERY_IN_USE"
  | QuoteErrorCode 
  | AuthorProfileErrorCode 
  | CategoryErrorCode;  // This will include CATEGORY_IN_USE

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

// Move UpdateQuoteInput interface here
export interface UpdateQuoteInput {
  content?: string;
  slug?: string;
  categoryId?: string;
  authorProfileId?: string;
  backgroundImage?: string | null;
  galleryImages?: Array<{
    id: string;
    isActive: boolean;
    isBackground: boolean;
  }>;
  tags?: {
    connect?: Array<{ id: string }>;
    disconnect?: Array<{ id: string }>;
  };
  addImages?: QuoteImageData[];
  removeImages?: string[];
}

