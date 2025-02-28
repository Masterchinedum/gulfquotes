// app/api/quotes/[slug]/comments/[commentId]/replies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import replyService from "@/lib/services/reply.service";
import { AppError } from "@/lib/api-error";
// import { Reply, Comment } from "@prisma/client";
import { ReplyData } from "@/schemas/comment.schema";

// Define response types
interface RepliesResponse {
  data?: {
    items: ReplyData[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

interface ReplyResponse {
  data?: ReplyData;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Define validation schema for creating a reply
const createReplySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(500, "Reply is too long")
});

// GET endpoint to fetch replies for a specific comment
export async function GET(
  req: NextRequest
): Promise<NextResponse<RepliesResponse>> {
  try {
    // Extract commentId from URL
    const commentId = req.url.split('/comments/')[1]?.split('/')[0];
    if (!commentId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid comment ID" } },
        { status: 400 }
      );
    }
    
    // Extract query parameters for pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    
    try {
      // Use the reply service to list replies
      const result = await replyService.listReplies({
        commentId,
        page,
        limit
      });
      
      // Return the replies
      return NextResponse.json({
        data: {
          items: result.items.map(reply => ({
            ...reply,
            user: reply.user || { 
              id: reply.userId,
              name: null, 
              image: null 
            }
          })),
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
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
    console.error("[REPLIES_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new reply
export async function POST(
  req: NextRequest
): Promise<NextResponse<ReplyResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract commentId from URL
    const commentId = req.url.split('/comments/')[1]?.split('/')[0];
    if (!commentId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid comment ID" } },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createReplySchema.safeParse(body);

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
      // Use the reply service to create a reply
      const reply = await replyService.createReply(
        commentId,
        validationResult.data,
        session.user
      );
      
      // Return the newly created reply
      return NextResponse.json({ data: reply });
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
    console.error("[REPLIES_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}