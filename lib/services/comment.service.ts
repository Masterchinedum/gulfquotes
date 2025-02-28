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

export interface CommentListParams {
  quoteSlug: string;
  page?: number;
  limit?: number;
  sortBy?: "recent" | "popular";
}

export interface CommentListResult {
  items: Comment[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface ReplyListParams {
  commentId: string;
  page?: number;
  limit?: number;
}

export interface ReplyListResult {
  items: Reply[];
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
          userId: user.id,
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
          userId: user.id,
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

  /**
   * Toggles a like on a comment
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      // Check if comment exists
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true, likes: true }
      });

      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }

      // Check if user already liked this comment
      const existingLike = await db.commentLike.findUnique({
        where: {
          commentId_userId: {
            commentId,
            userId
          }
        }
      });

      // If like exists, remove it (unlike)
      if (existingLike) {
        await db.commentLike.delete({
          where: {
            commentId_userId: {
              commentId,
              userId
            }
          }
        });

        const updatedComment = await db.comment.update({
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
      } 
      // Otherwise, add a like
      else {
        await db.commentLike.create({
          data: {
            commentId,
            userId
          }
        });

        const updatedComment = await db.comment.update({
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
    } catch (error) {
      console.error("Error toggling comment like:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle comment like", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Toggles a like on a reply
   */
  async toggleReplyLike(replyId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      // Check if reply exists
      const reply = await db.reply.findUnique({
        where: { id: replyId },
        select: { id: true, likes: true }
      });

      if (!reply) {
        throw new AppError("Reply not found", "NOT_FOUND", 404);
      }

      // Check if user already liked this reply
      const existingLike = await db.replyLike.findUnique({
        where: {
          replyId_userId: {
            replyId,
            userId
          }
        }
      });

      // If like exists, remove it (unlike)
      if (existingLike) {
        await db.replyLike.delete({
          where: {
            replyId_userId: {
              replyId,
              userId
            }
          }
        });

        const updatedReply = await db.reply.update({
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
      } 
      // Otherwise, add a like
      else {
        await db.replyLike.create({
          data: {
            replyId,
            userId
          }
        });

        const updatedReply = await db.reply.update({
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
    } catch (error) {
      console.error("Error toggling reply like:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle reply like", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Gets user like status for multiple comments
   */
  async getUserCommentLikes(commentIds: string[], userId: string): Promise<Record<string, boolean>> {
    try {
      const likes = await db.commentLike.findMany({
        where: {
          commentId: { in: commentIds },
          userId
        },
        select: { commentId: true }
      });
      
      // Create a map of commentId to liked status
      const likeMap: Record<string, boolean> = {};
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
   * Gets user like status for multiple replies
   */
  async getUserReplyLikes(replyIds: string[], userId: string): Promise<Record<string, boolean>> {
    try {
      const likes = await db.replyLike.findMany({
        where: {
          replyId: { in: replyIds },
          userId
        },
        select: { replyId: true }
      });
      
      // Create a map of replyId to liked status
      const likeMap: Record<string, boolean> = {};
      likes.forEach(like => {
        likeMap[like.replyId] = true;
      });
      
      return likeMap;
    } catch (error) {
      console.error("Error getting user reply likes:", error);
      throw new AppError("Failed to get user reply likes", "INTERNAL_ERROR", 500);
    }
  }
}

// Create and export singleton instance
const commentService = new CommentService();
export default commentService;