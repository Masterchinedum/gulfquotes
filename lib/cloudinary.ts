// lib/cloudinary.ts

if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not defined');
}

if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
  throw new Error('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not defined');
}

import { CloudinaryUploadOptions } from '@/types/cloudinary';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  folder: 'author-profiles',
  profileFolder: 'profile-pictures', // Add profile images folder
  maxFiles: 5 // Add maxFiles to config
} as const;

export const defaultUploadOptions: CloudinaryUploadOptions = {
  maxFiles: cloudinaryConfig.maxFiles, // Reference from config
  maxFileSize: 7 * 1024 * 1024, // 7MB
  uploadPreset: UPLOAD_PRESET,
  folder: cloudinaryConfig.folder,
  sources: ['local', 'url', 'camera'] as const, // Add type assertion
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
} as const;

export const profileUploadOptions: CloudinaryUploadOptions = {
  ...defaultUploadOptions,
  folder: cloudinaryConfig.profileFolder, // Use profile images folder
  maxFiles: 1, // Only allow one profile image
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
    const response = await fetch('/api/users/profile-image', {
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
  profile: { // Add profile image transform preset
    width: 150,
    height: 150,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    format: 'webp',
  },
} as const;