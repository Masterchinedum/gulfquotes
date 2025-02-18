// types/index.ts

// Re-export all tag-related types
export * from './api/tags';

// Add any additional shared types here
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}