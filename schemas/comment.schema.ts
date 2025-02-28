// schemas/comment.schema.ts
import { z } from "zod";

// Constants
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_REPLY_LENGTH = 500;

// Base schema for comment content validation
const contentSchema = {
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(MAX_COMMENT_LENGTH, `Comment must not exceed ${MAX_COMMENT_LENGTH} characters`)
    .trim()
};

// Schema for creating a new comment
export const createCommentSchema = z.object({
  ...contentSchema
});

// Schema for updating an existing comment
export const updateCommentSchema = z.object({
  ...contentSchema
});

// Schema for creating a new reply
export const createReplySchema = z.object({
  content: z.string()
    .min(1, "Reply cannot be empty")
    .max(MAX_REPLY_LENGTH, `Reply must not exceed ${MAX_REPLY_LENGTH} characters`)
    .trim()
});

// Schema for updating an existing reply
export const updateReplySchema = z.object({
  content: z.string()
    .min(1, "Reply cannot be empty")
    .max(MAX_REPLY_LENGTH, `Reply must not exceed ${MAX_REPLY_LENGTH} characters`)
    .trim()
});

// Types inferred from schemas
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type UpdateReplyInput = z.infer<typeof updateReplySchema>;

// Comment data type returned from API
export interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  likes: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    replies: number;
  };
}

// Reply data type returned from API
export interface ReplyData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt: Date | null;
  likes: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}