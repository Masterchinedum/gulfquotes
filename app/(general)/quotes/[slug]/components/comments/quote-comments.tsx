"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ThumbsUp, 
  MessageSquare, 
  MoreVertical, 
  Flag, 
  Clock, 
  TrendingUp, 
  Trash, 
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CommentForm } from "./comment-form";
import { CommentData, ReplyData } from "@/schemas/comment.schema";

interface QuoteCommentsProps {
  quoteId: string;
  className?: string;
}

type CommentWithReplies = CommentData & {
  replies?: ReplyData[];
  isLiked?: boolean;
};

export function QuoteComments({ className }: QuoteCommentsProps) {
  const { slug } = useParams() as { slug: string };
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<"recent" | "popular">("recent");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Fetch comments on component mount and when parameters change
  useEffect(() => {
    async function fetchComments() {
      try {
        setIsLoading(true);
        const url = new URL(`/api/quotes/${slug}/comments`, window.location.origin);
        url.searchParams.append('page', '1');
        url.searchParams.append('limit', '10');
        url.searchParams.append('sortBy', activeSort);

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch comments");
        
        const data = await response.json();
        
        // Transform data to include isLiked property
        const transformedComments = data.data.items.map((comment: CommentData) => ({
          ...comment,
          isLiked: false, // We'll implement like status in a future phase
          replies: [] // Initialize empty replies array
        }));
        
        setComments(transformedComments);
        setHasMore(data.data.hasMore);
        setPage(1);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast.error("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchComments();
  }, [slug, activeSort]);

  // Function to handle loading more comments
  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      const url = new URL(`/api/quotes/${slug}/comments`, window.location.origin);
      url.searchParams.append('page', nextPage.toString());
      url.searchParams.append('limit', '10');
      url.searchParams.append('sortBy', activeSort);

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch more comments");
      
      const data = await response.json();
      
      // Transform and add to existing comments
      const newComments = data.data.items.map((comment: CommentData) => ({
        ...comment,
        isLiked: false,
        replies: []
      }));
      
      setComments(prev => [...prev, ...newComments]);
      setHasMore(data.data.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more comments:", error);
      toast.error("Failed to load more comments");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Function to handle adding a new comment
  const handleCommentAdded = (newComment: CommentData) => {
    // Add the new comment to the beginning of the list with optimistic update
    const commentWithReplies: CommentWithReplies = {
      ...newComment,
      isLiked: false,
      replies: []
    };
    
    setComments(prev => [commentWithReplies, ...prev]);
  };

  // Function to handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error("Failed to delete comment");
      
      // Optimistically remove from UI
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Function to handle replying to a comment
  const handlePostReply = async (commentId: string) => {
    if (!replyText.trim() || !session?.user) return;
    
    try {
      const response = await fetch(`/api/quotes/${slug}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyText }),
      });
      
      if (!response.ok) throw new Error("Failed to post reply");
      
      const result = await response.json();
      
      // Optimistically update UI
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [
              ...(comment.replies || []),
              {
                ...result.data,
                isLiked: false,
              },
            ],
            _count: {
              replies: (comment._count?.replies || 0) + 1
            }
          };
        }
        return comment;
      }));
      
      // Reset reply state
      setReplyingTo(null);
      setReplyText("");
      
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    }
  };

  // Function to handle fetching replies for a comment
  const handleLoadReplies = async (commentId: string) => {
    try {
      const url = `/api/quotes/${slug}/comments/${commentId}/replies`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("Failed to fetch replies");
      
      const data = await response.json();
      
      // Update the comments state with fetched replies
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: data.data.items.map((reply: ReplyData) => ({
              ...reply,
              isLiked: false
            })),
            _count: {
              replies: data.data.total
            }
          };
        }
        return comment;
      }));
      
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error("Failed to load replies");
    }
  };

  // Function to check if user can edit/delete a comment
  const canModifyComment = (userId: string) => {
    if (!session?.user) return false;
    return session.user.id === userId || session.user.role === "AUTHOR" || session.user.role === "ADMIN";
  };

  // Function to handle like toggling (to be implemented with real API in future)
  const handleToggleLike = (commentId: string) => {
    if (status !== "authenticated") {
      toast.error("You must be signed in to like comments");
      return;
    }
    
    // Optimistic update for now - API integration will come later
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        const isNowLiked = !comment.isLiked;
        return {
          ...comment,
          isLiked: isNowLiked,
          likes: isNowLiked ? comment.likes + 1 : comment.likes - 1,
        };
      }
      
      // Check in replies
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map(reply => {
            if (reply.id === commentId) {
              const isNowLiked = !reply.isLiked;
              return {
                ...reply,
                isLiked: isNowLiked,
                likes: isNowLiked ? reply.likes + 1 : reply.likes - 1,
              } as ReplyData & { isLiked?: boolean };
            }
            return reply;
          })
        };
      }
      
      return comment;
    }));
  };
  
  // Sort comments based on active sort
  const sortedComments = [...comments].sort((a, b) => {
    if (activeSort === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return b.likes - a.likes;
    }
  });
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comments {comments.length > 0 && `(${comments.length})`}
          </CardTitle>
          
          <Tabs
            defaultValue="recent"
            value={activeSort}
            onValueChange={(value) => setActiveSort(value as "recent" | "popular")}
            className="w-[240px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="popular" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Popular
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Use the CommentForm component instead of the inline form */}
        <CommentForm 
          quoteSlug={slug} 
          onCommentAdded={handleCommentAdded} 
        />
        
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Comments List */
          <div className="space-y-6 mt-6">
            {sortedComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              sortedComments.map((comment) => (
                <div key={comment.id} className="space-y-4">
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
                                {canModifyComment(comment.user.id) ? (
                                  <>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteComment(comment.id)}
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={() => handleToggleLike(comment.id)}
                          disabled={status !== "authenticated"}
                        >
                          <ThumbsUp 
                            className={cn(
                              "h-3 w-3 mr-1", 
                              comment.isLiked && "fill-primary text-primary"
                            )} 
                          />
                          {comment.likes > 0 && comment.likes}
                          <span className="ml-1">Like</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            if (comment._count?.replies && comment._count.replies > 0 && (!comment.replies || comment.replies.length === 0)) {
                              // Load replies if we have some but haven't loaded them yet
                              handleLoadReplies(comment.id);
                            }
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          <span>
                            {replyingTo === comment.id ? "Cancel" : "Reply"} 
                            {comment._count?.replies ? ` (${comment._count.replies})` : ""}
                          </span>
                        </Button>
                      </div>

                      {/* Reply form */}
                      {status === "authenticated" && replyingTo === comment.id && (
                        <div className="mt-3 ml-8 flex gap-3">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                            <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex flex-col gap-2">
                            <textarea
                              placeholder="Write a reply..."
                              className="w-full resize-none border rounded-md p-2 text-sm"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={2}
                            />
                            <div className="flex justify-end">
                              <Button 
                                size="sm"
                                className="text-xs"
                                disabled={!replyText.trim()}
                                onClick={() => handlePostReply(comment.id)}
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-12 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
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
                                      {canModifyComment(reply.user.id) ? (
                                        <>
                                          <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="text-destructive">
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
                                onClick={() => handleToggleLike(reply.id)}
                                disabled={status !== "authenticated"}
                              >
                                <ThumbsUp 
                                  className={cn(
                                    "h-3 w-3 mr-1", 
                                    reply.isLiked && "fill-primary text-primary"
                                  )} 
                                />
                                {reply.likes > 0 && reply.likes}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
      
      {hasMore && !isLoading && (
        <CardFooter className="flex justify-center border-t pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More Comments"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}