// app/api/quotes/comment-counts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import db from "@/lib/prisma";
import { z } from "zod";

// Define request validation schema
const commentCountsRequestSchema = z.object({
  quoteIds: z.array(z.string()).nonempty("At least one quote ID is required")
});

// Define response type
type CommentCountsResponse = {
  data?: Record<string, number>;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};

/**
 * POST handler to get comment counts for multiple quotes in a single request
 */
export async function POST(req: Request): Promise<NextResponse<CommentCountsResponse>> {
  try {
    // Authentication is optional (public endpoint)
    await auth();
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = commentCountsRequestSchema.safeParse(body);
    
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
      // Query for comment counts of all requested quotes in a single db call
      const commentCounts = await db.comment.groupBy({
        by: ['quoteId'],
        where: {
          quoteId: {
            in: quoteIds
          }
        },
        _count: {
          id: true
        }
      });
      
      // Create a map of quoteId -> count
      const countMap: Record<string, number> = {};
      
      // Initialize all requested IDs with 0 count
      quoteIds.forEach(id => {
        countMap[id] = 0;
      });
      
      // Update counts for quotes that have comments
      commentCounts.forEach(item => {
        countMap[item.quoteId] = item._count.id;
      });
      
      return NextResponse.json({ data: countMap });
      
    } catch (error) {
      console.error("Error fetching comment counts:", error);
      throw new AppError("Failed to fetch comment counts", "INTERNAL_ERROR", 500);
    }
  } catch (error) {
    console.error("[COMMENT_COUNTS]", error);
    
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