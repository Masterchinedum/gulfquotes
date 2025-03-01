// app/api/comments/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { commentLikeService } from "@/lib/services/like";
import { AppError } from "@/lib/api-error";

interface LikeResponse {
  data: {
    liked: boolean;
    likes: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * POST handler for toggling like status on a comment
 */
export async function POST(req: NextRequest): Promise<NextResponse<LikeResponse>> {
  try {
    // Authentication is required for liking
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Extract comment ID from URL
    const commentId = req.url.split('/comments/')[1]?.split('/')[0];
    if (!commentId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid comment ID" } },
        { status: 400 }
      );
    }

    // Toggle like using the comment like service
    const result = await commentLikeService.toggleLike(commentId, session.user.id);

    // Return the result
    return NextResponse.json({
      data: result
    });

  } catch (error) {
    console.error("[COMMENT_LIKE_TOGGLE]", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to process like action" } },
      { status: 500 }
    );
  }
}