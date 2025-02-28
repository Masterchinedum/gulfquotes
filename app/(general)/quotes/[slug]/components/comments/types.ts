// app/(general)/quotes/[slug]/components/comments/types.ts
import { CommentData, ReplyData } from "@/schemas/comment.schema";

export type CommentWithReplies = CommentData & {
  replies?: ReplyWithLike[];
  isLiked?: boolean;
};

export type ReplyWithLike = ReplyData & { 
  isLiked?: boolean 
};