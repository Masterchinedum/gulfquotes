// lib/services/like/comment-like.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
// import type { CommentLike } from "@prisma/client";

class CommentLikeService {
  /**
   * Toggle a like for a comment
   * If the user has already liked the comment, remove the like
   * If the user has not liked the comment, add a like
   */
  async toggleLike(commentId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      // Check if the comment exists
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true }
      });
      
      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }
      
      // Check if the user has already liked this comment
      const existingLike = await db.commentLike.findUnique({
        where: {
          commentId_userId: {
            commentId,
            userId
          }
        }
      });
      
      // Transaction to ensure count stays in sync
      return await db.$transaction(async (tx) => {
        if (existingLike) {
          // User has already liked this comment, so remove the like
          await tx.commentLike.delete({
            where: {
              commentId_userId: {
                commentId,
                userId
              }
            }
          });
          
          // Decrement the likes counter on the comment
          const updatedComment = await tx.comment.update({
            where: { id: commentId },
            data: { 
              likes: { decrement: 1 } 
            },
            select: { likes: true }
          });
          
          return { 
            liked: false, 
            likes: updatedComment.likes 
          };
        } else {
          // User hasn't liked this comment yet, so add a like
          await tx.commentLike.create({
            data: {
              commentId,
              userId
            }
          });
          
          // Increment the likes counter on the comment
          const updatedComment = await tx.comment.update({
            where: { id: commentId },
            data: { 
              likes: { increment: 1 } 
            },
            select: { likes: true }
          });
          
          return { 
            liked: true, 
            likes: updatedComment.likes 
          };
        }
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle comment like", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get like status for multiple comments for a specific user
   */
  async getUserLikes(userId: string, commentIds: string[]): Promise<Record<string, boolean>> {
    try {
      const likes = await db.commentLike.findMany({
        where: {
          userId,
          commentId: { in: commentIds }
        },
        select: {
          commentId: true
        }
      });
      
      // Convert to a map of commentId -> boolean
      const likeMap: Record<string, boolean> = {};
      commentIds.forEach(id => {
        likeMap[id] = false;
      });
      
      likes.forEach(like => {
        likeMap[like.commentId] = true;
      });
      
      return likeMap;
    } catch (error) {
      console.error("Error getting user comment likes:", error);
      throw new AppError("Failed to get user comment likes", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get the total number of likes for a comment
   */
  async getLikeCount(commentId: string): Promise<number> {
    try {
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { likes: true }
      });
      
      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }
      
      return comment.likes;
    } catch (error) {
      console.error("Error getting comment like count:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to get comment like count", "INTERNAL_ERROR", 500);
    }
  }
}

// Create and export singleton instance
const commentLikeService = new CommentLikeService();
export default commentLikeService;