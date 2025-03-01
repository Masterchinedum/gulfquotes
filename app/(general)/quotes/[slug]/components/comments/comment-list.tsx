// app/(general)/quotes/[slug]/components/comments/comment-list.tsx
"use client";

import { 
  Clock,
  TrendingUp,
  MessageSquare, 
} from "lucide-react";
import { useState } from "react";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CommentData } from "@/schemas/comment.schema";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item"; // We'll create this component next

interface CommentListProps {
  comments: CommentData[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  activeSort: "recent" | "popular";
  quoteSlug: string;
  onSortChange: (sort: "recent" | "popular") => void;
  onCommentAdded: (comment: CommentData) => void;
  onLoadMore: () => void;
  onLoadReplies: (commentId: string) => Promise<void>;
  onToggleLike: (commentId: string) => void;
  onPostReply: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  onUpdateReply?: (replyId: string, content: string) => Promise<void>;
  likingIds?: Set<string>; // Add this property
  className?: string;
}

export function CommentList({
  comments,
  isLoading,
  hasMore,
  isLoadingMore,
  activeSort,
  quoteSlug,
  onSortChange,
  onCommentAdded,
  onLoadMore,
  onLoadReplies,
  onToggleLike,
  onPostReply,
  onDeleteComment,
  onUpdateComment,
  onDeleteReply,
  onUpdateReply,
  likingIds,
}: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Sort comments based on active sort
  const sortedComments = [...comments].sort((a, b) => {
    if (activeSort === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return b.likes - a.likes;
    }
  });
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comments {comments.length > 0 && `(${comments.length})`}
          </CardTitle>
          
          <Tabs
            defaultValue="recent"
            value={activeSort}
            onValueChange={(value) => onSortChange(value as "recent" | "popular")}
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
        {/* Comment Form */}
        <CommentForm 
          quoteSlug={quoteSlug} 
          onCommentAdded={onCommentAdded} 
        />
        
        {/* Loading State */}
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
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  onLoadReplies={onLoadReplies}
                  onToggleLike={onToggleLike}
                  onPostReply={onPostReply}
                  onDeleteComment={onDeleteComment}
                  onUpdateComment={onUpdateComment}
                  onDeleteReply={onDeleteReply}
                  onUpdateReply={onUpdateReply}
                  likingIds={likingIds} // Pass the prop here
                />
              ))
            )}
          </div>
        )}
      </CardContent>
      
      {/* Load More Button */}
      {hasMore && !isLoading && (
        <CardFooter className="flex justify-center border-t pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More Comments"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}