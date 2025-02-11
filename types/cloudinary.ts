import type { 
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetError as NextCloudinaryError,
  CloudinaryUploadWidgetConfig, // Changed from UploadWidgetConfig
  CloudinaryUploadWidgetInfo 
} from 'next-cloudinary';

// types/cloudinary.ts

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
}

// Define a more specific upload result type using CloudinaryUploadWidgetInfo
export interface CloudinaryUploadSuccess {
  event: 'success';
  info: CloudinaryUploadWidgetInfo;
}

// Use the same type as next-cloudinary expects
export type CloudinaryUploadResult = CloudinaryUploadWidgetResults;

// Update to use CloudinaryUploadWidgetConfig
export interface CloudinaryUploadOptions extends Omit<CloudinaryUploadWidgetConfig, 'cloudName' | 'uploadPreset'> {
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

// Use the error type from next-cloudinary
export type CloudinaryUploadWidgetError = NextCloudinaryError;

export interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: CloudinaryUploadWidgetError) => void;
  disabled?: boolean;
}