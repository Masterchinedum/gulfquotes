// lib/services/comment.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
// import { auth } from "@/auth";
import type { User } from "next-auth";
import type { Comment, Reply, Prisma } from "@prisma/client";
import { 
  CreateCommentInput, 
  UpdateCommentInput,
  CreateReplyInput,
  UpdateReplyInput 
} from "@/schemas/comment.schema";
import { commentLikeService, replyLikeService } from "@/lib/services/like";

// Enhanced interfaces for comments and replies with like status
interface CommentWithLikeStatus extends Comment {
  isLiked?: boolean;
}

interface ReplyWithLikeStatus extends Reply {
  isLiked?: boolean;
}

export interface CommentListParams {
  quoteSlug: string;
  page?: number;
  limit?: number;
  sortBy?: "recent" | "popular";
  userId?: string; // Add this for like status
}

export interface CommentListResult {
  items: CommentWithLikeStatus[]; // Changed from Comment[]
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface ReplyListParams {
  commentId: string;
  page?: number;
  limit?: number;
  userId?: string; // Add this for like status
}

export interface ReplyListResult {
  items: ReplyWithLikeStatus[]; // Changed from Reply[]
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

class CommentService {
  /**
   * Creates a new comment for a quote
   */
  async createComment(quoteSlug: string, data: CreateCommentInput, user: User): Promise<Comment> {
    // Find the quote by slug
    const quote = await db.quote.findUnique({
      where: { slug: quoteSlug },
      select: { id: true }
    });

    if (!quote) {
      throw new AppError("Quote not found", "NOT_FOUND", 404);
    }

    try {
      // Create the comment
      return await db.comment.create({
        data: {
          content: data.content,
          quoteId: quote.id,
          userId: user.id!, // Add non-null assertion operator
          likes: 0
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      throw new AppError("Failed to create comment", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Lists comments for a quote with pagination
   */
  async listComments(params: CommentListParams): Promise<CommentListResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    try {
      // Find the quote by slug
      const quote = await db.quote.findUnique({
        where: { slug: params.quoteSlug },
        select: { id: true }
      });

      if (!quote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }

      const orderBy: Prisma.CommentOrderByWithRelationInput = 
        params.sortBy === "popular" 
          ? { likes: 'desc' } 
          : { createdAt: 'desc' };

      const [items, total] = await Promise.all([
        db.comment.findMany({
          where: { quoteId: quote.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            _count: {
              select: {
                replies: true
              }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        db.comment.count({
          where: { quoteId: quote.id }
        })
      ]);

      // Add like status for all comments if userId is provided
      if (params.userId && items.length > 0) {
        const commentIds = items.map(comment => comment.id);
        const likeStatus = await commentLikeService.getUserLikes(params.userId, commentIds);
        
        // Merge like status into comments (with proper type casting)
        items.forEach(comment => {
          (comment as CommentWithLikeStatus).isLiked = likeStatus[comment.id] || false;
        });
      }

      return {
        items,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("Error listing comments:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to list comments", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Updates an existing comment
   */
  async updateComment(commentId: string, data: UpdateCommentInput, userId: string, userRole?: string): Promise<Comment> {
    try {
      // Check if comment exists
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true }
      });

      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }

      // Check permission
      const isOwner = comment.userId === userId;
      const hasPermission = isOwner || userRole === "AUTHOR" || userRole === "ADMIN";
      
      if (!hasPermission) {
        throw new AppError("You don't have permission to update this comment", "FORBIDDEN", 403);
      }

      // Update comment
      return await db.comment.update({
        where: { id: commentId },
        data: {
          content: data.content,
          isEdited: true,
          editedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update comment", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Deletes a comment
   */
  async deleteComment(commentId: string, userId: string, userRole?: string): Promise<Comment> {
    try {
      // Check if comment exists
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true }
      });

      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }

      // Check permission
      const isOwner = comment.userId === userId;
      const hasPermission = isOwner || userRole === "AUTHOR" || userRole === "ADMIN";
      
      if (!hasPermission) {
        throw new AppError("You don't have permission to delete this comment", "FORBIDDEN", 403);
      }

      // Delete comment and related replies
      return await db.comment.delete({
        where: { id: commentId }
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete comment", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Creates a new reply for a comment
   */
  async createReply(commentId: string, data: CreateReplyInput, user: User): Promise<Reply> {
    try {
      // Check if comment exists
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true }
      });

      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }

      // Create the reply
      return await db.reply.create({
        data: {
          content: data.content,
          commentId,
          userId: user.id!, // Add non-null assertion operator
          likes: 0
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create reply", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Lists replies for a comment with pagination
   */
  async listReplies(params: ReplyListParams): Promise<ReplyListResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    try {
      // Check if comment exists
      const comment = await db.comment.findUnique({
        where: { id: params.commentId },
        select: { id: true }
      });

      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }

      const [items, total] = await Promise.all([
        db.reply.findMany({
          where: { commentId: params.commentId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit
        }),
        db.reply.count({
          where: { commentId: params.commentId }
        })
      ]);

      // Add like status for all replies if userId is provided
      if (params.userId && items.length > 0) {
        const replyIds = items.map(reply => reply.id);
        const likeStatus = await replyLikeService.getUserLikes(params.userId, replyIds);
        
        // Merge like status into replies (with proper type casting)
        items.forEach(reply => {
          (reply as ReplyWithLikeStatus).isLiked = likeStatus[reply.id] || false;
        });
      }

      return {
        items,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("Error listing replies:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to list replies", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Updates a reply
   */
  async updateReply(replyId: string, data: UpdateReplyInput, userId: string, userRole?: string): Promise<Reply> {
    try {
      // Check if reply exists
      const reply = await db.reply.findUnique({
        where: { id: replyId },
        select: { id: true, userId: true }
      });

      if (!reply) {
        throw new AppError("Reply not found", "NOT_FOUND", 404);
      }

      // Check permission
      const isOwner = reply.userId === userId;
      const hasPermission = isOwner || userRole === "AUTHOR" || userRole === "ADMIN";
      
      if (!hasPermission) {
        throw new AppError("You don't have permission to update this reply", "FORBIDDEN", 403);
      }

      // Update reply
      return await db.reply.update({
        where: { id: replyId },
        data: {
          content: data.content,
          isEdited: true,
          editedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error updating reply:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update reply", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Deletes a reply
   */
  async deleteReply(replyId: string, userId: string, userRole?: string): Promise<Reply> {
    try {
      // Check if reply exists
      const reply = await db.reply.findUnique({
        where: { id: replyId },
        select: { id: true, userId: true }
      });

      if (!reply) {
        throw new AppError("Reply not found", "NOT_FOUND", 404);
      }

      // Check permission
      const isOwner = reply.userId === userId;
      const hasPermission = isOwner || userRole === "AUTHOR" || userRole === "ADMIN";
      
      if (!hasPermission) {
        throw new AppError("You don't have permission to delete this reply", "FORBIDDEN", 403);
      }

      // Delete reply
      return await db.reply.delete({
        where: { id: replyId }
      });
    } catch (error) {
      console.error("Error deleting reply:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete reply", "INTERNAL_ERROR", 500);
    }
  }
}

// Create and export singleton instance
const commentService = new CommentService();
export default commentService;