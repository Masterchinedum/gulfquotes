// app/api/quotes/like-status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import quoteLikeService from "@/lib/services/like/quote-like.service";
import { z } from "zod";

// Define request validation schema
const likeStatusRequestSchema = z.object({
  quoteIds: z.array(z.string()).nonempty("At least one quote ID is required")
});

// Define response type
type LikeStatusResponse = {
  data?: Record<string, boolean>;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};

/**
 * POST handler to get like status for multiple quotes in a single request
 */
export async function POST(req: Request): Promise<NextResponse<LikeStatusResponse>> {
  try {
    // Authentication is required for this endpoint
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = likeStatusRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validationResult.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }
    
    const { quoteIds } = validationResult.data;
    
    try {
      // Use the existing service function to get like status for multiple quotes
      const likeStatusMap = await quoteLikeService.getUserLikes(session.user.id, quoteIds);
      
      return NextResponse.json({ data: likeStatusMap });
      
    } catch (error) {
      console.error("Error fetching like status:", error);
      throw new AppError("Failed to fetch like status", "INTERNAL_ERROR", 500);
    }
  } catch (error) {
    console.error("[LIKE_STATUS]", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}