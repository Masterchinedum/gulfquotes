// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

interface CommentResponse {
  data?: {
    id: string;
    content: string;
    isEdited: boolean;
    editedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
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

// Function to check if user has AUTHOR or ADMIN role
function hasAuthorOrAdminRole(role?: UserRole): boolean {
  return role === 'AUTHOR' || role === 'ADMIN';
}

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
    
    // Check if comment exists
    const existingComment = await db.comment.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Comment not found" } },
        { status: 404 }
      );
    }
    
    // Check authorization: user must be the comment owner or have AUTHOR/ADMIN role
    const isOwner = existingComment.userId === session.user.id;
    const isAuthorOrAdmin = hasAuthorOrAdminRole(session.user.role as UserRole);
    
    if (!isOwner && !isAuthorOrAdmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You don't have permission to update this comment" } },
        { status: 403 }
      );
    }
    
    // Update the comment
    const updatedComment = await db.comment.update({
      where: { id },
      data: {
        content: validationResult.data.content,
        isEdited: true,
        editedAt: new Date()
      }
    });

    return NextResponse.json({ 
      data: updatedComment 
    });
    
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
    
    // Check if comment exists
    const existingComment = await db.comment.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Comment not found" } },
        { status: 404 }
      );
    }
    
    // Check authorization: user must be the comment owner or have AUTHOR/ADMIN role
    const isOwner = existingComment.userId === session.user.id;
    const isAuthorOrAdmin = hasAuthorOrAdminRole(session.user.role as UserRole);
    
    if (!isOwner && !isAuthorOrAdmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You don't have permission to delete this comment" } },
        { status: 403 }
      );
    }
    
    // Delete the comment (and all its replies due to cascading delete in schema)
    await db.comment.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: "Comment deleted successfully" 
    });
    
  } catch (error) {
    console.error("[COMMENT_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}