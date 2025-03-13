import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { ApiResponse } from "@/types/api/author-profiles";
import type { ProfileComment } from "@/types/api/users";

type CommentPaginatedResponse = ApiResponse<{
  items: ProfileComment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}>;

export async function GET(
  req: Request
): Promise<NextResponse<CommentPaginatedResponse>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract slug from URL directly
    const slug = req.url.split('/users/')[1]?.split('/')[0];
    
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid user slug" } },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Find user and check privacy settings
    const user = await db.user.findFirst({
      where: {
        OR: [
          { userProfile: { slug } },
          { userProfile: { username: slug } },
          { id: slug }
        ]
      },
      include: {
        userProfile: {
          select: {
            privacySettings: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Get comments with pagination
    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          quote: {
            select: {
              id: true,
              content: true,
              slug: true
            }
          }
        }
      }),
      db.comment.count({
        where: { userId: user.id }
      })
    ]);

    // Transform the data to match ProfileComment type
    const items = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      quote: {
        id: comment.quote.id,
        content: comment.quote.content,
        slug: comment.quote.slug
      }
    }));

    return NextResponse.json({
      data: {
        items,
        total,
        page,
        limit,
        hasMore: skip + items.length < total
      }
    });

  } catch (error) {
    console.error("[USER_COMMENTS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}