export interface CloudinaryUploadResult {
  info: {
    secure_url: string;
    public_id: string;
    resource_type: string;
    signature: string;
    timestamp: number;
  };
  event: 'success';
}

export interface CloudinaryWidgetOptions {
  cloudName: string;
  uploadSignature: string;
  apiKey: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  maxFiles: number;
}