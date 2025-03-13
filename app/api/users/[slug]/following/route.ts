import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { AuthorPaginatedResponse } from "@/types/api/authors";

export async function GET(
  req: Request
): Promise<NextResponse<AuthorPaginatedResponse>> {
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

    // Check privacy settings
    const privacySettings = user.userProfile?.privacySettings as { showFollowing: boolean } | null;
    const isCurrentUser = session.user.id === user.id;
    
    if (!isCurrentUser && privacySettings?.showFollowing === false) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "This user's following list is private" } },
        { status: 403 }
      );
    }

    // Get followed authors with pagination
    const [following, total] = await Promise.all([
      db.authorFollow.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            include: {
              images: {
                take: 1,
                select: {
                  url: true
                }
              }
            }
          }
        }
      }),
      db.authorFollow.count({
        where: { userId: user.id }
      })
    ]);

    // Transform the data to match ProfileFollowedAuthor type
    const items = following.map(follow => ({
      id: follow.author.id,
      name: follow.author.name,
      slug: follow.author.slug,
      image: follow.author.images[0]?.url || null,
      bio: follow.author.bio || null,
      createdAt: follow.createdAt.toISOString()
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
    console.error("[USER_FOLLOWING_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}