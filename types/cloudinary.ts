// types/cloudinary.ts

export interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  version: string;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
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
  uploadPreset?: string;
  folder?: string;
  sources?: string[];
  clientAllowedFormats?: string[];
}

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  error?: string;
};

export type CloudinaryWidgetResult = CloudinaryUploadResponse | CloudinaryError;

// Add CloudinaryConfig type
export interface CloudinaryConfig {
  cloudName: string | undefined;
  uploadPreset: string | undefined;
  folder: string;
  maxFiles: number;
}