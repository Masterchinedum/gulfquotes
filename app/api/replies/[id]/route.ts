// app/api/replies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

interface ReplyResponse {
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

// Define validation schema for updating a reply
const updateReplySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(500, "Reply is too long")
});

// Function to check if user has AUTHOR or ADMIN role
function hasAuthorOrAdminRole(role?: UserRole): boolean {
  return role === 'AUTHOR' || role === 'ADMIN';
}

// PATCH endpoint to update a reply
export async function PATCH(
  req: NextRequest
): Promise<NextResponse<ReplyResponse>> {
  try {
    // Extract id from URL
    const id = req.url.split('/replies/')[1]?.split('/')[0];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Reply ID is required" } },
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
    const validationResult = updateReplySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid reply data",
            details: validationResult.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }
    
    // Check if reply exists
    const existingReply = await db.reply.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!existingReply) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Reply not found" } },
        { status: 404 }
      );
    }
    
    // Check authorization: user must be the reply owner or have AUTHOR/ADMIN role
    const isOwner = existingReply.userId === session.user.id;
    const isAuthorOrAdmin = hasAuthorOrAdminRole(session.user.role as UserRole);
    
    if (!isOwner && !isAuthorOrAdmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You don't have permission to update this reply" } },
        { status: 403 }
      );
    }
    
    // Update the reply
    const updatedReply = await db.reply.update({
      where: { id },
      data: {
        content: validationResult.data.content,
        isEdited: true,
        editedAt: new Date()
      }
    });

    return NextResponse.json({ 
      data: updatedReply 
    });
    
  } catch (error) {
    console.error("[REPLY_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a reply
export async function DELETE(
  req: NextRequest
): Promise<NextResponse> {
  try {
    // Extract id from URL
    const id = req.url.split('/replies/')[1]?.split('/')[0];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Reply ID is required" } },
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
    
    // Check if reply exists
    const existingReply = await db.reply.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!existingReply) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Reply not found" } },
        { status: 404 }
      );
    }
    
    // Check authorization: user must be the reply owner or have AUTHOR/ADMIN role
    const isOwner = existingReply.userId === session.user.id;
    const isAuthorOrAdmin = hasAuthorOrAdminRole(session.user.role as UserRole);
    
    if (!isOwner && !isAuthorOrAdmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You don't have permission to delete this reply" } },
        { status: 403 }
      );
    }
    
    // Delete the reply
    await db.reply.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: "Reply deleted successfully" 
    });
    
  } catch (error) {
    console.error("[REPLY_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}