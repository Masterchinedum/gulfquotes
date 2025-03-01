// lib/services/like/reply-like.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
// import type { ReplyLike } from "@prisma/client";

class ReplyLikeService {
  /**
   * Toggle a like for a reply
   * If the user has already liked the reply, remove the like
   * If the user has not liked the reply, add a like
   */
  async toggleLike(replyId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      // Check if the reply exists
      const reply = await db.reply.findUnique({
        where: { id: replyId },
        select: { id: true }
      });
      
      if (!reply) {
        throw new AppError("Reply not found", "NOT_FOUND", 404);
      }
      
      // Check if the user has already liked this reply
      const existingLike = await db.replyLike.findUnique({
        where: {
          replyId_userId: {
            replyId,
            userId
          }
        }
      });
      
      // Transaction to ensure count stays in sync
      return await db.$transaction(async (tx) => {
        if (existingLike) {
          // User has already liked this reply, so remove the like
          await tx.replyLike.delete({
            where: {
              replyId_userId: {
                replyId,
                userId
              }
            }
          });
          
          // Decrement the likes counter on the reply
          const updatedReply = await tx.reply.update({
            where: { id: replyId },
            data: { 
              likes: { decrement: 1 } 
            },
            select: { likes: true }
          });
          
          return { 
            liked: false, 
            likes: updatedReply.likes 
          };
        } else {
          // User hasn't liked this reply yet, so add a like
          await tx.replyLike.create({
            data: {
              replyId,
              userId
            }
          });
          
          // Increment the likes counter on the reply
          const updatedReply = await tx.reply.update({
            where: { id: replyId },
            data: { 
              likes: { increment: 1 } 
            },
            select: { likes: true }
          });
          
          return { 
            liked: true, 
            likes: updatedReply.likes 
          };
        }
      });
    } catch (error) {
      console.error("Error toggling reply like:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle reply like", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get like status for multiple replies for a specific user
   */
  async getUserLikes(userId: string, replyIds: string[]): Promise<Record<string, boolean>> {
    try {
      const likes = await db.replyLike.findMany({
        where: {
          userId,
          replyId: { in: replyIds }
        },
        select: {
          replyId: true
        }
      });
      
      // Convert to a map of replyId -> boolean
      const likeMap: Record<string, boolean> = {};
      replyIds.forEach(id => {
        likeMap[id] = false;
      });
      
      likes.forEach(like => {
        likeMap[like.replyId] = true;
      });
      
      return likeMap;
    } catch (error) {
      console.error("Error getting user reply likes:", error);
      throw new AppError("Failed to get user reply likes", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get the total number of likes for a reply
   */
  async getLikeCount(replyId: string): Promise<number> {
    try {
      const reply = await db.reply.findUnique({
        where: { id: replyId },
        select: { likes: true }
      });
      
      if (!reply) {
        throw new AppError("Reply not found", "NOT_FOUND", 404);
      }
      
      return reply.likes;
    } catch (error) {
      console.error("Error getting reply like count:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to get reply like count", "INTERNAL_ERROR", 500);
    }
  }
}

// Create and export singleton instance
const replyLikeService = new ReplyLikeService();
export default replyLikeService;