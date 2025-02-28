// app/api/replies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import replyService from "@/lib/services/reply.service";
import { AppError } from "@/lib/api-error";
import type { ReplyData } from "@/schemas/comment.schema";

interface ReplyResponse {
  data?: ReplyData;
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
    
    try {
      // Use the reply service to update the reply
      const updatedReply = await replyService.updateReply(
        id, 
        validationResult.data, 
        session.user.id,
        session.user.role
      );
      
      return NextResponse.json({ data: updatedReply });
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
    
    try {
      // Use the reply service to delete the reply
      await replyService.deleteReply(
        id, 
        session.user.id,
        session.user.role
      );
      
      return NextResponse.json({ 
        success: true,
        message: "Reply deleted successfully" 
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
    console.error("[REPLY_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}