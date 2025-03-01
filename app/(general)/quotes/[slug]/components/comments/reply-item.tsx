// app/(general)/quotes/[slug]/components/comments/reply-item.tsx
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
// Remove this line if not used elsewhere
// import { useSession } from "next-auth/react";
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
  MoreVertical, 
  Flag, 
  Trash, 
  Edit,
  ThumbsUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReplyData } from "@/schemas/comment.schema";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCommentAuth } from "@/hooks/use-comment-auth";

// Update the props interface
interface ReplyItemProps {
  reply: ReplyData & { isLiked?: boolean };
  onToggleLike: (replyId: string) => void;
  onDeleteReply: (replyId: string) => Promise<void>;
  onUpdateReply: (replyId: string, content: string) => Promise<void>;
  likingIds?: Set<string>; // Add this
}

export function ReplyItem({ 
  reply, 
  onToggleLike, 
  onDeleteReply,
  onUpdateReply,
  likingIds
}: ReplyItemProps) {
  // Add the auth hook
  const { canModify, isAuthenticated } = useCommentAuth(reply.user.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove this function - we'll use the hook's canModify instead
  // const canModifyReply = () => {
  //   if (!session?.user) return false;
  //   return session.user.id === reply.user.id || 
  //          session.user.role === "AUTHOR" || 
  //          session.user.role === "ADMIN";
  // };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (editedContent.trim() === reply.content) {
      setIsEditing(false);
      return;
    }

    if (!editedContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateReply(reply.id, editedContent);
      setIsEditing(false);
      toast.success("Reply updated successfully");
    } catch (err) {
      console.error("Error updating reply:", err);
      toast.error("Failed to update reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await onDeleteReply(reply.id);
        toast.success("Reply deleted successfully");
      } catch (err) {
        console.error("Error deleting reply:", err);
        toast.error("Failed to delete reply");
      }
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={reply.user.image || undefined} alt={reply.user.name || "User"} />
          <AvatarFallback>{reply.user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 flex flex-col gap-2">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Edit your reply..."
            className="w-full resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedContent(reply.content);
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
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={reply.user.image || undefined} alt={reply.user.name || "User"} />
        <AvatarFallback>{reply.user.name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{reply.user.name || "Anonymous"}</h4>
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-1">
                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                {reply.isEdited && <span className="ml-1 italic">(edited)</span>}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canModify ? ( // Was canModifyReply()
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
          
          <p className="mt-1 text-sm break-words">{reply.content}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-1 ml-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => onToggleLike(reply.id)}
            disabled={!isAuthenticated || likingIds?.has(reply.id)}
          >
            {likingIds?.has(reply.id) ? (
              <span className="flex items-center">
                <span className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </span>
            ) : (
              <ThumbsUp 
                className={cn(
                  "h-3 w-3 mr-1", 
                  reply.isLiked && "fill-primary text-primary"
                )} 
              />
            )}
            {reply.likes > 0 && reply.likes}
          </Button>
        </div>
      </div>
    </div>
  );
}