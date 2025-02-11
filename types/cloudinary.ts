import type { 
  CldUploadWidgetResults,
  CloudinaryUploadWidgetError as NextCloudinaryError,
  UploadWidgetConfig // Add this import
} from 'next-cloudinary';

// types/cloudinary.ts

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
}

export interface CloudinaryUploadResponse {
  event: 'success';
  info: CloudinaryResource;
}

export interface CloudinaryError {
  event: 'error';
  error: {
    message: string;
    status: number;
  };
}

export interface CloudinaryUploadOptions extends Omit<UploadWidgetConfig, 'cloudName' | 'uploadPreset'> {
  maxFiles?: number;
  maxFileSize?: number;
  folder?: string;
  sources?: ("local" | "url" | "camera" | "dropbox" | "facebook" | "instagram" | "google_drive" | "shutterstock" | "gettyimages" | "istock" | "unsplash" | "image_search")[];
}

export interface CloudinaryInfo {
  secure_url: string;
  public_id: string;
}

export type CloudinaryUploadResult = CldUploadWidgetResults;

export type CloudinaryWidgetResult = CloudinaryUploadResponse | CloudinaryError;

// Use the error type from next-cloudinary
export type CloudinaryUploadWidgetError = NextCloudinaryError;

export interface CloudinaryConfig {
  cloudName: string | undefined;
  uploadPreset: string | undefined;
  folder: string;
  maxFiles: number;
}

export interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: CloudinaryUploadWidgetError) => void;
  disabled?: boolean;
}