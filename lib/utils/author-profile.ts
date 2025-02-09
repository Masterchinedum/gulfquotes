// File: lib/utils/author-profile.ts

import { AuthorProfile, Quote } from "@prisma/client";
import { slugify } from "@/lib/utils";

/**
 * Generate a slug for an author profile
 */
export function generateAuthorProfileSlug(name: string): string {
  return slugify(name);
}

/**
 * Sanitize author profile text fields
 */
export function sanitizeAuthorProfileData(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s.,!?'"()-]/g, ''); // Allow basic punctuation and characters
}

/**
 * Format birth/death dates for display
 */
export function formatLifespan(born?: string | null, died?: string | null): string {
  if (!born && !died) return 'Unknown';
  if (born && !died) return `Born: ${born}`;
  if (!born && died) return `Died: ${died}`;
  return `${born} - ${died}`;
}

/**
 * Parse and format influences string into an array
 */
export function parseInfluences(influences?: string | null): string[] {
  if (!influences) return [];
  return influences
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * Format influences array back to string
 */
export function formatInfluences(influences: string[]): string {
  return influences.join(', ');
}

/**
 * Format author profile for display
 */
export interface FormattedAuthorProfile {
  id: string;
  name: string;
  lifespan: string;
  influences: string[];
  bio: string;
  slug: string;
  quoteCount?: number;
}

export function formatAuthorProfile(author: AuthorProfile & { quotes?: Quote[] }): FormattedAuthorProfile {
  return {
    id: author.id,
    name: author.name,
    lifespan: formatLifespan(author.born, author.died),
    influences: parseInfluences(author.influences),
    bio: author.bio,
    slug: author.slug,
    quoteCount: author.quotes?.length
  };
}