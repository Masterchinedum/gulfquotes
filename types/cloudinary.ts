import type { 
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetError as NextCloudinaryError,
  CloudinaryUploadWidgetInfo 
} from 'next-cloudinary';

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
}

// Profile image specific resource
export interface ProfileImageResource extends CloudinaryResource {
  folder: string;
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
export interface CloudinaryUploadOptions {
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
}

// Enhanced config type
export interface CloudinaryConfig {
  cloudName: string | undefined;
  uploadPreset: string | undefined;
  folders: {
    profiles: string;
    authors: string;
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

export type { CloudinaryUploadWidgetInfo };