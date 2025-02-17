// lib/cloudinary.ts

import type { 
  CloudinaryUploadOptions,
  CloudinaryConfig 
} from '@/types/cloudinary';

if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not defined');
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  folders: {
    profiles: 'user-profiles',
    authors: 'author-profiles',
  },
  limits: {
    maxFileSize: 7 * 1024 * 1024, // 7MB
    profiles: {
      maxFiles: 1,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'] as const,
    },
    authors: {
      maxFiles: 5,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'] as const,
    }
  }
} as const;

// Helper function to get max files based on type
export function getMaxFiles(type: 'profiles' | 'authors'): number {
  return cloudinaryConfig.limits[type].maxFiles;
}

// Helper function to get folder based on type
export function getFolder(type: 'profiles' | 'authors'): string {
  return cloudinaryConfig.folders[type];
}

// Update the upload options interfaces
export const defaultUploadOptions: Partial<CloudinaryUploadOptions> = {
  maxFileSize: cloudinaryConfig.limits.maxFileSize,
  uploadPreset: UPLOAD_PRESET,
  sources: ['local', 'url', 'camera'] as const,
} as const;

// Profile-specific upload options
export const profileUploadOptions: CloudinaryUploadOptions = {
  ...defaultUploadOptions,
  maxFiles: getMaxFiles('profiles'),
  folder: getFolder('profiles'),
  clientAllowedFormats: [...cloudinaryConfig.limits.profiles.allowedFormats],
  styles: {
    palette: {
      window: "#ffffff",
      sourceBg: "#f4f5f5",
      windowBorder: "#90a0b3",
      tabIcon: "#0078ff",
      inactiveTabIcon: "#0e2f5a",
      menuIcons: "#555a5f",
      link: "#0078ff",
      action: "#339933",
      inProgress: "#0078ff",
      complete: "#339933",
      error: "#cc0000",
      textDark: "#000000",
      textLight: "#fcfffd"
    }
  }
} as const;

// Author-specific upload options
export const authorUploadOptions: CloudinaryUploadOptions = {
  ...defaultUploadOptions,
  maxFiles: getMaxFiles('authors'),
  folder: getFolder('authors'),
  clientAllowedFormats: [...cloudinaryConfig.limits.authors.allowedFormats],
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
    const origin = process.env.NEXTAUTH_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : '');
    
    const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
    
    const response = await fetch(`${origin}/api/users/profile-image`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error("Failed to delete image");
    }
    
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
  profile: {
    thumbnail: {
      width: 64,
      height: 64,
      crop: 'thumb',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    },
    display: {
      width: 150,
      height: 150,
      crop: 'thumb',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    },
    large: {
      width: 300,
      height: 300,
      crop: 'thumb',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    }
  }
} as const;