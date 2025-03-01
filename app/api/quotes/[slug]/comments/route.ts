// app/api/quotes/[slug]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import commentService from "@/lib/services/comment.service";
import { AppError } from "@/lib/api-error";
import { CommentData } from "@/schemas/comment.schema";

// Define an interface for the database comment object
interface DatabaseComment {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  content: string;
  isEdited: boolean;
  editedAt: Date | null;
  likes: number;
  quoteId: string;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    replies: number;
  };
}

// Define response types
interface CommentsResponse {
  data?: {
    items: CommentData[];  // Replace any[] with CommentData[]
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
  data?: CommentData;  // Replace any with CommentData
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Define validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long")
});

// GET endpoint to fetch comments for a quote
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
    const sortBy = (searchParams.get("sortBy") as "recent" | "popular") || "recent";
    
    try {
      // Use the comment service to list comments
      const result = await commentService.listComments({
        quoteSlug: slug,
        page,
        limit,
        sortBy
      });
      
      // Return the comments with proper transformation
      return NextResponse.json({
        data: {
          items: result.items.map((comment: DatabaseComment) => ({
            ...comment,
            user: comment.user || { 
              id: comment.userId,
              name: null, 
              image: null 
            }
          })),
          total: result.total,
          hasMore: result.hasMore,
          page: result.page,
          limit: result.limit
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
    console.error("[COMMENTS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new comment
export async function POST(
  req: NextRequest
): Promise<NextResponse<CommentResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
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

    try {
      // Use the comment service to create a comment
      const comment = await commentService.createComment(
        slug,
        validationResult.data,
        session.user
      );
      
      // Return the newly created comment with proper type assertion
      return NextResponse.json({ 
        data: comment as unknown as CommentData 
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
    console.error("[COMMENTS_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}