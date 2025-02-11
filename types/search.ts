import type { Quote, User, AuthorProfile } from "@prisma/client";

// Base search params
export interface SearchParams {
  q: string;
  type?: SearchType;
  page?: number;
  limit?: number;
}

// Search result types
export type SearchType = "all" | "quotes" | "authors" | "users";

// Base search result interface
export interface SearchResultBase {
  id: string;
  type: SearchType;
  matchedOn: string; // Field where the match was found
  score: number; // Relevance score
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

// Paginated search response
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Search API error
export interface SearchError {
  code: 
    | "INVALID_QUERY"
    | "INVALID_TYPE" 
    | "RATE_LIMIT_EXCEEDED"
    | "INTERNAL_ERROR";
  message: string;
}

// Final API response type
export interface SearchApiResponse {
  data?: SearchResponse;
  error?: SearchError;
}