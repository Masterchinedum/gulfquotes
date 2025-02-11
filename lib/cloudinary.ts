// lib/cloudinary.ts

import { CloudinaryUploadOptions } from '@/types/cloudinary';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  folder: 'author-profiles',
} as const;

export const defaultUploadOptions: CloudinaryUploadOptions = {
  maxFiles: 5,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  uploadPreset: UPLOAD_PRESET,
  folder: 'author-profiles',
  sources: ['local', 'url', 'camera'],
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
} as const;

export function buildImageUrl(publicId: string, transforms = imageTransforms.full) {
  const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  const transformString = Object.entries(transforms)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `${baseUrl}${transformString ? '/' + transformString : ''}/${publicId}`;
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) throw new Error('Failed to delete image');
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

export function getImagePublicId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const publicIdWithExtension = pathParts[pathParts.length - 1];
    return publicIdWithExtension.split('.')[0];
  } catch {
    return null;
  }
}

export const imageTransforms = {
  thumbnail: {
    width: 100,
    height: 100,
    crop: 'fill',
    quality: 'auto',
    format: 'webp',
  },
  preview: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'webp',
  },
  full: {
    width: 1024,
    crop: 'scale',
    quality: 'auto',
    format: 'webp',
  },
} as const;