import type { 
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetError,
  UploadWidgetConfig,
  // CloudinaryUploadWidgetInfo 
} from 'next-cloudinary';

// types/cloudinary.ts

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
}

// Update the result type to match next-cloudinary's type
export type CloudinaryUploadResult = CloudinaryUploadWidgetResults;

export interface CloudinaryUploadOptions extends Omit<UploadWidgetConfig, 'cloudName' | 'uploadPreset'> {
  maxFiles?: number;
  maxFileSize?: number;
  folder?: string;
  sources?: ("local" | "url" | "camera" | "dropbox" | "facebook" | "instagram" | "google_drive" | "shutterstock" | "gettyimages" | "istock" | "unsplash" | "image_search")[];
  clientAllowedFormats?: string[];
}

export interface CloudinaryConfig {
  cloudName: string | undefined;
  uploadPreset: string | undefined;
  folder: string;
  maxFiles: number;
}

export type CloudinaryUploadWidgetError = CloudinaryUploadWidgetError;

export interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: CloudinaryUploadWidgetError) => void;
  disabled?: boolean;
}