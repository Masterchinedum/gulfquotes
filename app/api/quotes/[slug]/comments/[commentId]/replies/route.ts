// app/api/quotes/[slug]/comments/[commentId]/replies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { z } from "zod";

// Define response types
interface RepliesResponse {
  data?: {
    items: ReplyWithUser[];
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
  data?: ReplyWithUser;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Define the type for replies with user info
type ReplyWithUser = {
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
};

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
    
    // Calculate offset for pagination
    const skip = (page - 1) * limit;

    // Check if the comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true }
    });

    if (!comment) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Comment not found" } },
        { status: 404 }
      );
    }

    // Get replies for this comment with pagination
    const [replies, totalCount] = await Promise.all([
      db.reply.findMany({
        where: { commentId },
        orderBy: { createdAt: 'asc' }, // Show oldest replies first
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          isEdited: true,
          editedAt: true,
          likes: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      }),
      db.reply.count({ where: { commentId } })
    ]);

    // Calculate if there are more pages
    const hasMore = skip + replies.length < totalCount;

    // Return the replies
    return NextResponse.json({
      data: {
        items: replies,
        total: totalCount,
        page,
        limit,
        hasMore
      }
    });

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
    if (!session?.user || !session.user.id) {
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

    // Check if the comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true }
    });

    if (!comment) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Comment not found" } },
        { status: 404 }
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

    // Create the reply
    const reply = await db.reply.create({
      data: {
        content: validationResult.data.content,
        commentId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Return the newly created reply
    return NextResponse.json({ 
      data: reply as unknown as ReplyWithUser 
    });

  } catch (error) {
    console.error("[REPLIES_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}