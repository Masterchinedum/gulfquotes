// app/(general)/quotes/[slug]/components/comment-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
// Import the login prompt component
import { LoginPrompt } from "../login-prompt";

// Comment schema
const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

// Define a proper type for the comment data returned from API
interface CommentData {
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

interface CommentFormProps {
  quoteSlug: string;
  onCommentAdded?: (comment: CommentData) => void;
  className?: string;
}

export function CommentForm({ quoteSlug, onCommentAdded, className }: CommentFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  async function onSubmit(data: CommentFormValues) {
    if (status !== "authenticated") {
      toast.error("You must be signed in to comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quoteSlug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to post comment");
      }

      // Reset the form
      form.reset();
      
      // Call the callback with the new comment data
      if (onCommentAdded && result.data) {
        onCommentAdded(result.data as CommentData);
      }
      
      // Refresh the page data
      router.refresh();
      toast.success("Comment posted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show login prompt if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className={className}>
        <LoginPrompt 
          variant="inline" 
          description="Sign in to add your comment to this quote."
          callToAction="Sign in now"
          redirectUrl={`/quotes/${quoteSlug}`} 
        />
      </div>
    );
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className={`flex gap-3 ${className}`}>
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-20 w-full bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border rounded-lg p-4 ${className}`}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
              <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Add a comment..." 
                        className="resize-none min-h-24"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-1"
                >
                  {isSubmitting ? "Posting..." : "Post"}
                  <Send className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}