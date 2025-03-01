// lib/services/follow/types.ts
/**
 * Record that maps author profile IDs to their follow status (true/false)
 */
export type FollowStatusMap = Record<string, boolean>;

/**
 * Interface for follow toggle response
 */
export interface FollowToggleResponse {
  followed: boolean;
  followers: number;
}

/**
 * Type for author data returned in follow lists
 */
export interface FollowedAuthorData {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  image?: string | null;
  quoteCount?: number;
  followers: number;
}

/**
 * Interface for the author follow service
 */
export interface FollowService {
  /**
   * Toggle follow status for an author (follow if not following, unfollow if following)
   */
  toggleFollow(authorProfileId: string, userId: string): Promise<FollowToggleResponse>;
  
  /**
   * Check if a specific author is followed by a user
   */
  getFollowStatus(authorProfileId: string, userId: string): Promise<boolean>;
  
  /**
   * Get follow status for multiple authors at once
   */
  getUserFollows(userId: string, authorProfileIds: string[]): Promise<FollowStatusMap>;
  
  /**
   * Get current follower count for an author
   */
  getFollowerCount(authorProfileId: string): Promise<number>;
  
  /**
   * Get all authors followed by a user
   */
  getFollowedAuthors(userId: string, page?: number, limit?: number): Promise<{
    items: FollowedAuthorData[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }>;
}