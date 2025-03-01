// app/(general)/quotes/[slug]/components/comments/comment-item.tsx
"use client";

import { useState } from "react";
// Delete this line since we're using the hook instead
// import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  MessageSquare, 
  MoreVertical, 
  Flag, 
  ThumbsUp,
  Trash, 
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentData, ReplyData } from "@/schemas/comment.schema";
import { ReplyForm } from "./reply-form";
import { ReplyItem } from "./reply-item";
import { useCommentAuth } from "@/hooks/use-comment-auth";

interface CommentItemProps {
  comment: CommentData & {
    replies?: (ReplyData & { isLiked?: boolean })[];
    isLiked?: boolean;
  };
  replyingTo: string | null;
  setReplyingTo: (commentId: string | null) => void;
  onLoadReplies: (commentId: string) => Promise<void>;
  onToggleLike: (id: string) => void;
  onPostReply: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  onUpdateReply?: (replyId: string, content: string) => Promise<void>;
  likingIds?: Set<string>; // Add this property
}

export function CommentItem({ 
  comment, 
  replyingTo,
  setReplyingTo,
  onLoadReplies,
  onToggleLike,
  onDeleteComment,
  onUpdateComment,
  onDeleteReply,
  onUpdateReply,
  likingIds
}: CommentItemProps) {
  // Replace session with the auth hook
  const { canModify, isAuthenticated } = useCommentAuth(comment.user.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!onUpdateComment) return;
    if (editedContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateComment(comment.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await onDeleteComment(comment.id);
    }
  };

  // If in editing mode, show edit form
  if (isEditing) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.user.image || undefined} alt={comment.user.name || "User"} />
          <AvatarFallback>{comment.user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full resize-none border rounded-md p-2 text-sm"
            rows={3}
            disabled={isSubmitting}
            aria-label="Edit comment"
          />
          <div className="flex justify-end gap-2">
            <Button 
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedContent(comment.content);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleEditSubmit}
              disabled={isSubmitting || !editedContent.trim()}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Comment */}
      <div className="flex gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.user.image || undefined} alt={comment.user.name || "User"} />
          <AvatarFallback>{comment.user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{comment.user.name || "Anonymous"}</h4>
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground mr-1">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canModify ? (
                      <>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleDelete}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <p className="mt-1 text-sm break-words">{comment.content}</p>
          </div>
          
          {/* Comment Actions */}
          <div className="flex items-center gap-2 mt-1 ml-1">
            {/* Like Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={() => onToggleLike(comment.id)}
              disabled={!isAuthenticated || likingIds?.has(comment.id)} // Add the condition
            >
              {likingIds?.has(comment.id) ? (
                <span className="flex items-center">
                  <span className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-1">Liking...</span>
                </span>
              ) : (
                <>
                  <ThumbsUp className={cn("h-3 w-3 mr-1", comment.isLiked && "fill-primary text-primary")} />
                  {comment.likes > 0 && comment.likes}
                  <span className="ml-1">Like</span>
                </>
              )}
            </Button>
            
            {/* View Replies Button - Add this */}
            {(comment._count?.replies || 0) > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => {
                  // First, ensure replies are loaded
                  if (!comment.replies || comment.replies.length === 0) {
                    onLoadReplies(comment.id);
                  }
                }}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>View Replies ({comment._count?.replies || 0})</span>
              </Button>
            )}
            
            {/* Reply Button - Keep this separate */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              <span>{replyingTo === comment.id ? "Cancel" : "Reply"}</span>
            </Button>
          </div>

          {/* Reply form */}
          {isAuthenticated && replyingTo === comment.id && ( // Replace status check with isAuthenticated
            <ReplyForm 
              commentId={comment.id}
              quoteSlug={window.location.pathname.split('/quotes/')[1]?.split('/')[0] || ''}
              onReplyAdded={() => {
                setReplyingTo(null);
              }}
              onCancel={() => setReplyingTo(null)}
            />
          )}
        </div>
      </div>
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-4">
          {comment.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              onToggleLike={onToggleLike}
              onDeleteReply={onDeleteReply || (() => Promise.resolve())}
              onUpdateReply={onUpdateReply || (() => Promise.resolve())}
            />
          ))}
        </div>
      )}
    </div>
  );
}