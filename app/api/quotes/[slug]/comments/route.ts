// app/api/quotes/[slug]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { z } from "zod";

// Define response types
interface CommentsResponse {
  data?: {
    items: CommentWithUser[];
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

interface CommentResponse {
  data?: CommentWithUser;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Define the type for comments with user info
type CommentWithUser = {
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
  // Include reply count, but not the actual replies for initial load
  _count?: {
    replies: number;
  };
};

// Define validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long")
});

// GET endpoint to fetch comments for a specific quote
export async function GET(
  req: NextRequest
): Promise<NextResponse<CommentsResponse>> {
  try {
    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid quote slug" } },
        { status: 400 }
      );
    }
    
    // Extract query parameters for pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    const sortBy = searchParams.get("sortBy") || "recent"; // "recent" or "popular"
    
    // Calculate offset for pagination
    const skip = (page - 1) * limit;

    // Find the quote by slug
    const quote = await db.quote.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Define sort order based on the sortBy parameter
    const orderBy = sortBy === "popular" 
      ? { likes: "desc" as const } 
      : { createdAt: "desc" as const };

    // Get comments for this quote with pagination
    const [comments, totalCount] = await Promise.all([
      db.comment.findMany({
        where: { quoteId: quote.id },
        orderBy,
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
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      }),
      db.comment.count({ where: { quoteId: quote.id } })
    ]);

    // Calculate if there are more pages
    const hasMore = skip + comments.length < totalCount;

    // Return the comments
    return NextResponse.json({
      data: {
        items: comments as CommentWithUser[],
        total: totalCount,
        page,
        limit,
        hasMore
      }
    });

  } catch (error) {
    console.error("[COMMENTS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new comment
export async function POST(
  req: Request
): Promise<NextResponse<CommentResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    // Find the quote by slug
    const quote = await db.quote.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createCommentSchema.safeParse(body);

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

    // Create the comment
    const comment = await db.comment.create({
      data: {
        content: validationResult.data.content,
        quoteId: quote.id,
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

    // Return the newly created comment
    return NextResponse.json({ 
      data: comment as unknown as CommentWithUser 
    });

  } catch (error) {
    console.error("[COMMENTS_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}