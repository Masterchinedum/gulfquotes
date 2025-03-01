// lib/services/follow/author-follow.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { Prisma, AuthorFollow } from "@prisma/client";
import { FollowService, FollowStatusMap, FollowToggleResponse } from "./types";

class AuthorFollowServiceImpl implements FollowService {
  /**
   * Toggle follow status for an author
   * If the user already follows the author, unfollow
   * If the user doesn't follow the author, follow
   */
  async toggleFollow(authorProfileId: string, userId: string): Promise<FollowToggleResponse> {
    try {
      // Check if the author profile exists
      const authorProfile = await db.authorProfile.findUnique({
        where: { id: authorProfileId },
        select: { id: true }
      });
      
      if (!authorProfile) {
        throw new AppError("Author profile not found", "NOT_FOUND", 404);
      }
      
      // Check if the user already follows this author
      const existingFollow = await db.authorFollow.findUnique({
        where: {
          userId_authorProfileId: {
            userId,
            authorProfileId
          }
        }
      });
      
      // Transaction to ensure count stays in sync
      return await db.$transaction(async (tx: Prisma.TransactionClient) => {
        if (existingFollow) {
          // User already follows this author, so unfollow
          await tx.authorFollow.delete({
            where: {
              userId_authorProfileId: {
                userId,
                authorProfileId
              }
            }
          });
          
          // Decrement the followers counter
          const updatedAuthor = await tx.authorProfile.update({
            where: { id: authorProfileId },
            data: { 
              followers: { decrement: 1 } 
            },
            select: { followers: true }
          });
          
          return { 
            followed: false, 
            followers: updatedAuthor.followers 
          };
        } else {
          // User doesn't follow this author yet, so follow
          await tx.authorFollow.create({
            data: {
              userId,
              authorProfileId
            }
          });
          
          // Increment the followers counter
          const updatedAuthor = await tx.authorProfile.update({
            where: { id: authorProfileId },
            data: { 
              followers: { increment: 1 } 
            },
            select: { followers: true }
          });
          
          return { 
            followed: true, 
            followers: updatedAuthor.followers 
          };
        }
      });
    } catch (error) {
      console.error("Error toggling author follow:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle author follow", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Check if a specific author is followed by a user
   */
  async getFollowStatus(authorProfileId: string, userId: string): Promise<boolean> {
    try {
      const follow = await db.authorFollow.findUnique({
        where: {
          userId_authorProfileId: {
            userId,
            authorProfileId
          }
        }
      });
      
      return !!follow;
    } catch (error) {
      console.error("Error checking follow status:", error);
      throw new AppError("Failed to check follow status", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get follow status for multiple authors for a specific user
   */
  async getUserFollows(userId: string, authorProfileIds: string[]): Promise<FollowStatusMap> {
    try {
      const follows = await db.authorFollow.findMany({
        where: {
          userId,
          authorProfileId: { in: authorProfileIds }
        },
        select: {
          authorProfileId: true
        }
      });
      
      // Convert to a map of authorProfileId -> boolean
      const followMap: FollowStatusMap = {};
      authorProfileIds.forEach(id => {
        followMap[id] = false;
      });
      
      follows.forEach((follow: { authorProfileId: string }) => {
        followMap[follow.authorProfileId] = true;
      });
      
      return followMap;
    } catch (error) {
      console.error("Error getting user follows:", error);
      throw new AppError("Failed to get user follows", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get the total number of followers for an author
   */
  async getFollowerCount(authorProfileId: string): Promise<number> {
    try {
      const result = await db.authorProfile.findUnique({
        where: { id: authorProfileId },
        select: { followers: true }
      });
      
      return result?.followers || 0;
    } catch (error) {
      console.error("Error getting author follower count:", error);
      throw new AppError("Failed to get author follower count", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get all authors followed by a user
   */
  async getFollowedAuthors(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [items, total] = await Promise.all([
        db.authorProfile.findMany({
          where: {
            userFollowers: {
              some: {
                userId
              }
            }
          },
          include: {
            images: {
              take: 1,
              select: {
                url: true
              }
            },
            _count: {
              select: {
                quotes: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { name: 'asc' }
        }),
        db.authorFollow.count({
          where: { userId }
        })
      ]);
      
      // Transform the items to include image property
      const transformedItems = items.map(item => ({
        ...item,
        image: item.images?.[0]?.url || null,
        quoteCount: item._count.quotes,
        _count: undefined,
        images: undefined
      }));
      
      return {
        items: transformedItems,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("Error getting followed authors:", error);
      throw new AppError("Failed to get followed authors", "INTERNAL_ERROR", 500);
    }
  }
}

export const authorFollowService = new AuthorFollowServiceImpl();
