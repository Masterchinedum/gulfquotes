"use client"

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
  Send 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface QuoteCommentsProps {
  quoteId: string;
  className?: string;
}

// Sample comment data structure
interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

// Sample user data
const currentUser = {
  id: "user-1",
  name: "Current User",
  image: "",
};

// Sample comments data
const sampleComments: Comment[] = [
  {
    id: "comment-1",
    content: "This quote really resonates with me. I've found that taking time to reflect on our actions is essential for personal growth.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    author: {
      id: "user-2",
      name: "Sophie Taylor",
      image: "",
    },
    likes: 5,
    isLiked: false,
    replies: [
      {
        id: "reply-1",
        content: "I completely agree! Reflection has been key to my own journey as well.",
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        author: {
          id: "user-3",
          name: "Michael Johnson",
          image: "",
        },
        likes: 2,
        isLiked: true,
      }
    ]
  },
  {
    id: "comment-2",
    content: "I've had this quote on my wall for years. It's a constant reminder to stay true to myself.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    author: {
      id: "user-4",
      name: "Alex Rivera",
      image: "",
    },
    likes: 12,
    isLiked: false,
  },
  {
    id: "comment-3",
    content: "The author has such a profound way of expressing universal truths in simple language.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    author: {
      id: "user-5",
      name: "Jamie Lee",
      image: "",
    },
    likes: 8,
    isLiked: true,
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function QuoteComments({ quoteId, className }: QuoteCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(sampleComments);
  const [commentText, setCommentText] = useState("");
  const [activeSort, setActiveSort] = useState<"recent" | "popular">("recent");
  
  // Handle comment submission
  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    
    // Create new comment
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      content: commentText,
      createdAt: new Date(),
      author: currentUser,
      likes: 0,
      isLiked: false,
    };
    
    // Add to comments
    setComments([newComment, ...comments]);
    setCommentText("");
  };
  
  // Handle like toggling
  const handleToggleLike = (commentId: string) => {
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
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => {
            if (reply.id === commentId) {
              const isNowLiked = !reply.isLiked;
              return {
                ...reply,
                isLiked: isNowLiked,
                likes: isNowLiked ? reply.likes + 1 : reply.likes - 1,
              };
            }
            return reply;
          })
        };
      }
      
      return comment;
    }));
  };
  
  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    if (activeSort === "recent") {
      return b.createdAt.getTime() - a.createdAt.getTime();
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
            Comments ({comments.length})
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
        {/* Comment Input */}
        <div className="flex gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.image} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex flex-col gap-2">
            <Textarea 
              placeholder="Share your thoughts on this quote..." 
              className="w-full resize-none"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={handleSubmitComment} 
                disabled={!commentText.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Comment
              </Button>
            </div>
          </div>
        </div>
        
        {/* Comments List */}
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
                    <AvatarImage src={comment.author.image} alt={comment.author.name} />
                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{comment.author.name}</h4>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                          </span>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Flag className="h-4 w-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <p className="mt-1 text-sm">{comment.content}</p>
                    </div>
                    
                    {/* Comment Actions */}
                    <div className="flex items-center gap-2 mt-1 ml-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleToggleLike(comment.id)}
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
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>Reply</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-12 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.author.image} alt={reply.author.name} />
                          <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{reply.author.name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                              </span>
                            </div>
                            
                            <p className="mt-1 text-sm">{reply.content}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 ml-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs"
                              onClick={() => handleToggleLike(reply.id)}
                            >
                              <ThumbsUp 
                                className={cn(
                                  "h-3 w-3 mr-1", 
                                  reply.isLiked && "fill-primary text-primary"
                                )} 
                              />
                              {reply.likes}
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
      </CardContent>
      
      <CardFooter className="flex justify-center border-t pt-4">
        <Button variant="outline" size="sm">
          Load More Comments
        </Button>
      </CardFooter>
    </Card>
  );
}