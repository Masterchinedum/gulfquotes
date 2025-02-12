import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils.ts
interface GenerateUserSlugParams {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userId: string;  // This must be required and non-null
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove special characters
    .replace(/[\s_-]+/g, '-')    // Replace spaces and underscore with hyphen
    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphen
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function generateUserSlug(params: GenerateUserSlugParams): string {
  const { username, firstName, lastName, userId } = params;
  
  // Priority 1: Username
  if (username) {
    return slugify(username);
  }
  
  // Priority 2: First name and last name
  if (firstName && lastName) {
    const nameSlug = slugify(`${firstName}-${lastName}`);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${nameSlug}-${randomStr}`;
  }
  
  // Priority 3: Fallback to userId
  return userId;
}