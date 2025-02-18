import type { 
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetError as NextCloudinaryError,
  CloudinaryUploadWidgetInfo,
  CloudinaryUploadWidgetOptions 
} from 'next-cloudinary';
import type { QuoteErrorCode } from '@/types/api/quotes'; // Add this import

// Base resource interface
export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  resource_type: 'image';
  created_at: string;
  bytes: number;
  folder: string;
}

// Profile image specific resource
export interface ProfileImageResource extends CloudinaryResource {
  context?: {
    userId?: string;
    alt?: string;
  };
}

// Upload success response
export interface CloudinaryUploadSuccess {
  event: 'success';
  info: CloudinaryUploadWidgetInfo;
}

export type CloudinaryUploadResult = CloudinaryUploadWidgetResults;

// Enhanced upload options
export interface CloudinaryUploadOptions extends Omit<CloudinaryUploadWidgetOptions, 'sources'> {
  maxFiles?: number;
  maxFileSize?: number;
  folder?: string;
  uploadPreset?: string;
  sources?: ("local" | "url" | "camera")[];
  clientAllowedFormats?: string[];
  styles?: {
    palette?: {
      window?: string;
      sourceBg?: string;
      windowBorder?: string;
      tabIcon?: string;
      inactiveTabIcon?: string;
      menuIcons?: string;
      link?: string;
      action?: string;
      inProgress?: string;
      complete?: string;
      error?: string;
      textDark?: string;
      textLight?: string;
    };
  };
  cropping?: boolean;
  croppingAspectRatio?: number;
  croppingShowDimensions?: boolean;
  croppingValidateDimensions?: boolean;
  showPoweredBy?: boolean;
  showAdvancedOptions?: boolean;
  showSkipCropButton?: boolean;
  maxImageWidth?: number;
  maxImageHeight?: number;

  // Add new media library specific options
  showMediaLibrary?: boolean;
  mediaLibraryOptions?: MediaLibraryOptions;
  onMediaLibrarySelect?: (items: MediaLibraryItem[]) => void;
}

// Enhanced config type
export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folders: {
    profiles: string;
    authors: string;
    quotes: string;    // Add this
  };
  limits: {
    maxFileSize: number;
    profiles: {
      maxFiles: number;
      allowedFormats: readonly string[];
    };
    authors: {
      maxFiles: number;
      allowedFormats: readonly string[];
    };
    quotes: {         // Add this
      maxFiles: number;
      allowedFormats: readonly string[];
    };
  };
}

export type CloudinaryUploadWidgetError = NextCloudinaryError;

// Profile specific props
export interface ProfileImageUploadProps {
  imageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
  maxFiles?: number;
  cropAspectRatio?: number;
  showAdvancedOptions?: boolean;
}

// Add new quote image specific resource
export interface QuoteImageResource extends CloudinaryResource {
  context?: {
    quoteId?: string;
    alt?: string;
  };
}

// Add quote specific props
export interface QuoteImageUploadProps {
  images?: string[];
  onImagesChange: (urls: string[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  showAdvancedOptions?: boolean;
}

// Define QuoteImageData
export interface QuoteImageData extends Omit<MediaLibraryItem, 'context'> {
  url: string;
  publicId: string;
  isActive: boolean;
  isGlobal: boolean;
  title?: string;
  description?: string;
  altText?: string;
  usageCount: number;
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  resource_type: "image"; // Ensure this is a literal type
  created_at: string;
  bytes: number;
  folder: string;
}

// Media Library specific interfaces
export interface MediaLibraryItem extends QuoteImageResource {
  isGlobal: boolean;
  title?: string;
  description?: string;
  altText?: string;
  usageCount: number;
}

export interface MediaLibrarySuccessResponse {
  items: MediaLibraryItem[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface MediaLibraryErrorResponse {
  error: {
    code: QuoteErrorCode;
    message: string;
  };
}

export type MediaLibraryResponse = MediaLibrarySuccessResponse | MediaLibraryErrorResponse;

// Sorting options
export type MediaLibrarySortField = 
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'usageCount';

export type SortDirection = 'asc' | 'desc';

export interface MediaLibrarySortOption {
  field: MediaLibrarySortField;
  direction: SortDirection;
}

// Filtering options
export interface MediaLibraryFilterOptions {
  search?: string;
  isGlobal?: boolean;
  minUsageCount?: number;
  maxUsageCount?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  formats?: string[];
}

// Pagination options
export interface MediaLibraryPaginationOptions {
  page?: number;
  limit?: number;
}

// Combined options for fetching media library
export interface MediaLibraryOptions {
  sort?: MediaLibrarySortOption;
  filter?: MediaLibraryFilterOptions;
  pagination?: MediaLibraryPaginationOptions;
}

export type { CloudinaryUploadWidgetInfo };