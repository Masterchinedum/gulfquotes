import type { Quote, User, AuthorProfile } from "@prisma/client";

// Enhanced search params with filtering, sorting and faceting
export interface SearchParams {
  q: string;                      // Search query
  type?: SearchType;              // Content type filter
  page?: number;                  // Pagination
  limit?: number;                 // Results per page
  
  // New filter options
  filters?: {
    categories?: string[];        // Filter by category IDs
    authors?: string[];           // Filter by author IDs
    dateRange?: {
      from?: Date | string;       // Filter by creation date (from)
      to?: Date | string;         // Filter by creation date (to)
    };
    featured?: boolean;           // Filter for featured content only
    tags?: string[];              // Filter by tags
  };
  
  // Sorting options
  sort?: {
    field: SortField;             // Field to sort by
    direction: SortDirection;     // Sort direction
  };
  
  // Request facets (aggregated counts)
  includeFacets?: {
    categories?: boolean;         // Include category counts
    authors?: boolean;            // Include author counts
    tags?: boolean;               // Include tag counts
    dates?: boolean;              // Include date-based facets
  };
  
  // Relevance settings
  relevance?: {
    boostExactMatches?: boolean;  // Give higher score to exact matches
    boostTitleMatches?: boolean;  // Give higher score to title/name matches
  };
}

// Search result types (existing)
export type SearchType = "all" | "quotes" | "authors" | "users";

// New sort fields and directions
export type SortField = "relevance" | "date" | "alphabetical" | "popularity";
export type SortDirection = "asc" | "desc";

// Add the missing base interface for search results
export interface SearchResultBase {
  id: string;
  type: SearchType;
  score: number;
  matchedOn: string;  // Indicates which field matched the search query (e.g., "content", "name", "bio")
}

// Type-specific search results
export interface QuoteSearchResult extends SearchResultBase {
  type: "quotes";
  data: Pick<Quote, "content" | "slug"> & {
    authorName: string;
    category: string;
  };
}

export interface AuthorSearchResult extends SearchResultBase {
  type: "authors";
  data: Pick<AuthorProfile, "name" | "slug" | "bio">;
}

export interface UserSearchResult extends SearchResultBase {
  type: "users";
  data: Pick<User, "name" | "image">;
}

// Combined search result type
export type SearchResult = 
  | QuoteSearchResult 
  | AuthorSearchResult 
  | UserSearchResult;

// Add facets to search response
export interface SearchFacets {
  categories?: Array<{ id: string; name: string; count: number }>;
  authors?: Array<{ id: string; name: string; count: number }>;
  tags?: Array<{ id: string; name: string; count: number }>;
  dates?: {
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    older: number;
  };
}

// Update the search response to include facets
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets?: SearchFacets;   // Add facets to response
}

// Search API error
export interface SearchError {
  code: 
    | "INVALID_QUERY"
    | "INVALID_TYPE"
    | "INVALID_PARAM" // Add this line
    | "RATE_LIMIT_EXCEEDED"
    | "INTERNAL_ERROR";
  message: string;
}

// Final API response type
export interface SearchApiResponse {
  data?: SearchResponse;
  error?: SearchError;
}

// Add this to /types/search.ts
export interface SearchSuggestion {
  query: string;
  score: number;
}