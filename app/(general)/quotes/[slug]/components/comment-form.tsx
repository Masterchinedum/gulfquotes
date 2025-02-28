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
      <div className={`flex flex-col gap-4 p-4 bg-muted/30 rounded-lg ${className}`}>
        <p className="text-sm text-center text-muted-foreground">
          You need to be signed in to comment on this quote.
        </p>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`)}
        >
          Sign in to comment
        </Button>
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
    <div className={`flex gap-3 ${className}`}>
      <Avatar className="h-9 w-9">
        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
        <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    placeholder="Share your thoughts on this quote..." 
                    className="w-full resize-none"
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
              size="sm" 
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>Posting...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Comment
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}