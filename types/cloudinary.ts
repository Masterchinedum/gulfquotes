export interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  public_id: string;
  resource_type: string;
  original_filename: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  created_at: string;
  etag: string;
  url: string;
}

export interface CloudinaryUploadResult {
  event: string | undefined;
  info: CloudinaryUploadWidgetInfo;
}

export interface CloudinaryWidgetOptions {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  maxFiles: number;
}