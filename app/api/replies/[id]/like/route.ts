// app/api/replies/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { replyLikeService } from "@/lib/services/like";
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
 * POST handler for toggling like status on a reply
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

    // Extract reply ID from URL
    const replyId = req.url.split('/replies/')[1]?.split('/')[0];
    if (!replyId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid reply ID" } },
        { status: 400 }
      );
    }

    // Toggle like using the reply like service
    const result = await replyLikeService.toggleLike(replyId, session.user.id);

    // Return the result
    return NextResponse.json({
      data: result
    });

  } catch (error) {
    console.error("[REPLY_LIKE_TOGGLE]", error);
    
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