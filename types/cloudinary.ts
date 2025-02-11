import type { CldUploadWidgetResults } from 'next-cloudinary';

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

export interface CloudinaryUploadOptions {
  maxFiles?: number;
  maxFileSize?: number;
  folder?: string;
  clientAllowedFormats?: string[];
  sources?: string[];
}

export interface CloudinaryInfo {
  secure_url: string;
  public_id: string;
}

export type CloudinaryUploadResult = CldUploadWidgetResults;

export type CloudinaryWidgetResult = CloudinaryUploadResponse | CloudinaryError;

export interface CloudinaryConfig {
  cloudName: string | undefined;
  uploadPreset: string | undefined;
  folder: string;
  maxFiles: number;
}