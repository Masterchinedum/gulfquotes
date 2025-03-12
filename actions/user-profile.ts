// lib/actions/user-profile.ts
import { headers } from "next/headers";
import { UserProfileIncludeParams, UserResponse } from "@/types/api/users";
import { auth } from "@/auth";

/**
 * Fetches a user profile with specified included relationships
 * 
 * @param slug - User identifier (slug, username, or ID)
 * @param include - Optional parameters specifying which relationships to include
 * @returns UserResponse containing user data with requested relationships
 */
export async function fetchUserProfile(
  slug: string, 
  include?: UserProfileIncludeParams
): Promise<UserResponse> {
  try {
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";

    // Build URL with query parameters for includes
    let url = `${origin}/api/users/${slug}`;
    if (include) {
      const params = new URLSearchParams();
      
      if (include.quotes) params.append('includeQuotes', 'true');
      if (include.likes) params.append('includeLikes', 'true');
      if (include.bookmarks) params.append('includeBookmarks', 'true');
      if (include.comments) params.append('includeComments', 'true');
      if (include.followedAuthors) params.append('includeFollowedAuthors', 'true');

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const res = await fetch(url, {
      headers: {
        cookie: headersList.get("cookie") || "",
      },
      cache: "no-store",
    });

    const result: UserResponse = await res.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Add isCurrentUser flag for frontend permission checks
    if (result.data) {
      const session = await auth();
      result.data.isCurrentUser = session?.user?.id === result.data.id;
    }

    return result;
  } catch (error) {
    console.error("[FETCH_USER_PROFILE]", error);
    throw error;
  }
}

/**
 * Helper function to fetch profile data with all relationships
 * Useful for complete profile views
 */
export async function fetchCompleteUserProfile(slug: string): Promise<UserResponse> {
  return fetchUserProfile(slug, {
    quotes: true,
    likes: true,
    bookmarks: true,
    comments: true,
    followedAuthors: true
  });
}

/**
 * Helper function to fetch minimal profile data
 * Useful for components that only need basic info
 */
export async function fetchBasicUserProfile(slug: string): Promise<UserResponse> {
  return fetchUserProfile(slug);
}