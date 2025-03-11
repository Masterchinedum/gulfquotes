"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import Link from "next/link";
import { MessageSquare, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
// import { cn } from "@/lib/utils";
import { ProfileComment } from "@/types/api/users";

interface UserCommentsProps {
  comments: ProfileComment[];
  title?: string;
  emptyMessage?: string | React.ReactNode;
  className?: string;
  isCurrentUser: boolean;
  limit?: number;
}

type SortOption = "recent" | "oldest";

export function UserComments({
  comments,
  title = "Comments",
  emptyMessage = "No comments yet.",
  className,
  isCurrentUser,
  limit = 10
}: UserCommentsProps) {
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);

  // Calculate how many comments to display
  const itemsPerPage = expanded ? comments.length : limit;
  const maxPageIndex = Math.ceil(comments.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, comments.length);

  // Sort comments based on the selected option
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOption === "recent" ? dateB - dateA : dateA - dateB;
  });

  // Get current page of comments
  const visibleComments = sortedComments.slice(startIndex, endIndex);

  // Format date
  const formatCommentDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  }, []);

  // Handle page navigation
  const nextPage = () => {
    if (page < maxPageIndex) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  // Truncate quote content for display
  const truncateQuote = (content: string, maxLength: number = 100) => {
    return content.length <= maxLength 
      ? content 
      : `${content.substring(0, maxLength)}...`;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {title} {comments.length > 0 ? `(${comments.length})` : ""}
          </CardTitle>
          {isCurrentUser && comments.length > 0 && (
            <CardDescription>
              Here are your comments across different quotes
            </CardDescription>
          )}
        </div>

        {comments.length > 0 && (
          <Select
            value={sortOption}
            onValueChange={(value: SortOption) => {
              setSortOption(value);
              setPage(1); // Reset to first page when sort changes
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {typeof emptyMessage === "string" ? (
              <p>{emptyMessage}</p>
            ) : (
              emptyMessage
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visibleComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border rounded-lg overflow-hidden transition-all hover:border-primary/50"
                >
                  {/* Quote context */}
                  <div className="bg-muted/60 p-3 text-sm border-b">
                    <Link 
                      href={`/quotes/${comment.quote.slug}`}
                      className="flex items-center justify-between group"
                    >
                      <span className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        &quot;{truncateQuote(comment.quote.content, 80)}&quot;
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                  
                  {/* Comment content */}
                  <div className="p-3 space-y-2">
                    <div className="text-sm">
                      {comment.content}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCommentDate(comment.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {comments.length > limit && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={page === maxPageIndex}
                    >
                      Next
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {maxPageIndex}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        Show All
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}