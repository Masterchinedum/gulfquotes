// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import commentService from "@/lib/services/comment.service";
import { AppError } from "@/lib/api-error";
import type { CommentData } from "@/schemas/comment.schema";

interface CommentResponse {
  data?: CommentData;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Define validation schema for updating a comment
const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long")
});

// PATCH endpoint to update a comment
export async function PATCH(
  req: NextRequest
): Promise<NextResponse<CommentResponse>> {
  try {
    // Extract id from URL
    const id = req.url.split('/comments/')[1]?.split('/')[0];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Comment ID is required" } },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid comment data",
            details: validationResult.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }
    
    try {
      // Use the comment service to update the comment
      const updatedComment = await commentService.updateComment(
        id, 
        validationResult.data, 
        session.user.id,
        session.user.role
      );
      
      // Cast the response to ensure it includes all required fields
      return NextResponse.json({ 
        data: updatedComment as unknown as CommentData 
      });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[COMMENT_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a comment
export async function DELETE(
  req: NextRequest
): Promise<NextResponse> {
  try {
    // Extract id from URL
    const id = req.url.split('/comments/')[1]?.split('/')[0];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Comment ID is required" } },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    
    try {
      // Use the comment service to delete the comment
      await commentService.deleteComment(
        id, 
        session.user.id,
        session.user.role
      );
      
      return NextResponse.json({ 
        success: true,
        message: "Comment deleted successfully" 
      });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[COMMENT_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}