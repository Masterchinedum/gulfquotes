"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CommentData, ReplyData } from "@/schemas/comment.schema";
import { CommentList } from "./comment-list";
import { CommentWithReplies, ReplyWithLike } from "./types";
import { LoginPrompt } from "../login-prompt";

interface QuoteCommentsProps {
  className?: string; 
}

export function QuoteComments({ className }: QuoteCommentsProps) {
  const { slug } = useParams() as { slug: string };
  // Only destructure what we use - remove session
  const { status } = useSession();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<"recent" | "popular">("recent");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const isAuthenticated = status === "authenticated";

  // Fetch comments on component mount and when parameters change
  useEffect(() => {
    async function fetchComments() {
      try {
        setIsLoading(true);
        const url = new URL(`/api/quotes/${slug}/comments`, window.location.origin);
        url.searchParams.append('page', '1');
        url.searchParams.append('limit', '10');
        url.searchParams.append('sortBy', activeSort);
        
        // Add user ID parameter if authenticated to get like status
        if (isAuthenticated) {
          url.searchParams.append('includeUserLikes', 'true');
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch comments");
        
        const data = await response.json();
        
        // Use the isLiked property from the API if available
        const transformedComments = data.data.items.map((comment: CommentData) => ({
          ...comment,
          isLiked: comment.isLiked || false,
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
  }, [slug, activeSort, isAuthenticated]);

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
  const handlePostReply = async (commentId: string, content: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (!content.trim()) {
      toast.error("Reply content cannot be empty");
      return;
    }
    
    try {
      const response = await fetch(`/api/quotes/${slug}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
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
              } as ReplyWithLike,
            ],
            _count: {
              replies: (comment._count?.replies || 0) + 1
            }
          };
        }
        return comment;
      }));
      
      toast.success("Reply posted successfully");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    }
  };

  // Function to handle fetching replies for a comment
  const handleLoadReplies = async (commentId: string) => {
    try {
      const url = new URL(`/api/quotes/${slug}/comments/${commentId}/replies`, window.location.origin);
      
      // Add user ID parameter if authenticated to get like status
      if (isAuthenticated) {
        url.searchParams.append('includeUserLikes', 'true');
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) throw new Error("Failed to fetch replies");
      
      const data = await response.json();
      
      // Update the comments state with fetched replies (using isLiked from API if available)
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: data.data.items.map((reply: ReplyData): ReplyWithLike => ({
              ...reply,
              isLiked: reply.isLiked || false
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

  // Function to handle deleting a reply
  const handleDeleteReply = async (replyId: string) => {
    try {
      const response = await fetch(`/api/replies/${replyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error("Failed to delete reply");
      
      // Optimistically update UI by removing the reply from its parent comment
      setComments(prev => prev.map(comment => {
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply.id !== replyId),
            _count: {
              replies: Math.max(0, (comment._count?.replies || 0) - 1)
            }
          };
        }
        return comment;
      }));
      
      toast.success("Reply deleted successfully");
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  // Function to handle updating a reply
  const handleUpdateReply = async (replyId: string, content: string) => {
    try {
      const response = await fetch(`/api/replies/${replyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) throw new Error("Failed to update reply");
      
      const result = await response.json();
      
      // Update the reply in the UI
      setComments(prev => prev.map(comment => {
        if (comment.replies) {
          const replyIndex = comment.replies.findIndex(reply => reply.id === replyId);
          if (replyIndex !== -1) {
            const updatedReplies = [...comment.replies];
            updatedReplies[replyIndex] = {
              ...updatedReplies[replyIndex],
              ...result.data,
            };
            return {
              ...comment,
              replies: updatedReplies,
            };
          }
        }
        return comment;
      }));
      
      toast.success("Reply updated successfully");
    } catch (error) {
      console.error("Error updating reply:", error);
      toast.error("Failed to update reply");
    }
  };

  // Function to handle updating a comment
  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) throw new Error("Failed to update comment");
      
      const result = await response.json();
      
      // Update the comment in the UI
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            ...result.data,
          };
        }
        return comment;
      }));
      
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  // Function to handle like toggling
  const handleToggleLike = async (id: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Determine if this is a comment or reply
    let isComment = true;
    let commentId = id;
    
    // Check if it's a reply by searching through all comments
    for (const comment of comments) {
      if (comment.replies) {
        const foundReply = comment.replies.find(reply => reply.id === id);
        if (foundReply) {
          isComment = false;
          break;
        }
      }
    }
    
    // Add to loading set
    setLikingIds(prev => new Set(prev).add(id));
    
    // Optimistic update
    setComments(prev => prev.map(comment => {
      if (comment.id === id) {
        const isNowLiked = !comment.isLiked;
        return {
          ...comment,
          isLiked: isNowLiked,
          likes: isNowLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1),
        };
      }
      
      // Check in replies
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map(reply => {
            if (reply.id === id) {
              const isNowLiked = !reply.isLiked;
              return {
                ...reply,
                isLiked: isNowLiked,
                likes: isNowLiked ? reply.likes + 1 : Math.max(0, reply.likes - 1),
              };
            }
            return reply;
          })
        };
      }
      
      return comment;
    }));
    
    try {
      // Determine the API endpoint based on whether it's a comment or reply
      const endpoint = isComment 
        ? `/api/comments/${id}/like` 
        : `/api/replies/${id}/like`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error("Failed to toggle like");
      
      const result = await response.json();
      
      // Update UI with server response (handles any potential sync issues)
      setComments(prev => prev.map(comment => {
        if (comment.id === id) {
          return {
            ...comment,
            isLiked: result.data.liked,
            likes: result.data.likes,
          };
        }
        
        // Check in replies
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === id) {
                return {
                  ...reply,
                  isLiked: result.data.liked,
                  likes: result.data.likes,
                };
              }
              return reply;
            })
          };
        }
        
        return comment;
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like status");
      
      // Revert the optimistic update on error
      setComments(prev => prev.map(comment => {
        if (comment.id === id) {
          const revertedIsLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked: revertedIsLiked,
            likes: revertedIsLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1),
          };
        }
        
        // Check in replies
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === id) {
                const revertedIsLiked = !reply.isLiked;
                return {
                  ...reply,
                  isLiked: revertedIsLiked,
                  likes: revertedIsLiked ? reply.likes + 1 : Math.max(0, reply.likes - 1),
                };
              }
              return reply;
            })
          };
        }
        
        return comment;
      }));
    } finally {
      // Remove from loading set
      setLikingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  return (
    <>
      {showLoginPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="max-w-md w-full">
            <LoginPrompt 
              title="Sign in to interact"
              description="You need to be signed in to like comments or replies."
              callToAction="Sign in now"
              redirectUrl={`/quotes/${slug}`}
              onClose={() => setShowLoginPrompt(false)}
            />
          </div>
        </div>
      )}
      
      <CommentList
        comments={comments}
        isLoading={isLoading}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        activeSort={activeSort}
        quoteSlug={slug}
        onSortChange={(sort) => setActiveSort(sort)}
        onCommentAdded={handleCommentAdded}
        onLoadMore={handleLoadMore}
        onLoadReplies={handleLoadReplies}
        onToggleLike={handleToggleLike}
        onPostReply={handlePostReply}
        onDeleteComment={handleDeleteComment}
        onUpdateComment={handleUpdateComment}
        onDeleteReply={handleDeleteReply}
        onUpdateReply={handleUpdateReply}
        className={className}
      />
    </>
  );
}