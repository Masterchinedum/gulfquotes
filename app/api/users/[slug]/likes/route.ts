import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { QuotePaginatedResponse } from "@/types/api/quotes";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
): Promise<NextResponse<QuotePaginatedResponse>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
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
          { userProfile: { slug: params.slug } },
          { userProfile: { username: params.slug } },
          { id: params.slug }
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
    const privacySettings = user.userProfile?.privacySettings as { showLikes: boolean } | null;
    const isCurrentUser = session.user.id === user.id;
    
    if (!isCurrentUser && privacySettings?.showLikes === false) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "This user's likes are private" } },
        { status: 403 }
      );
    }

    // Get liked quotes with pagination
    const [likes, total] = await Promise.all([
      db.quoteLike.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          quote: {
            select: {
              id: true,
              content: true,
              slug: true,
              backgroundImage: true,
              createdAt: true,
              category: {
                select: {
                  name: true,
                  slug: true
                }
              },
              authorProfile: {
                select: {
                  name: true,
                  slug: true,
                  image: true
                }
              },
              likes: true,
              _count: {
                select: {
                  comments: true,
                  userBookmarks: true
                }
              }
            }
          }
        }
      }),
      db.quoteLike.count({
        where: { userId: user.id }
      })
    ]);

    // Transform the data
    const items = likes.map(like => ({
      ...like.quote,
      isLiked: true, // Since these are liked quotes
      commentCount: like.quote._count.comments,
      bookmarkCount: like.quote._count.userBookmarks,
      author: {
        name: like.quote.authorProfile.name,
        slug: like.quote.authorProfile.slug,
        image: like.quote.authorProfile.image
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
    console.error("[USER_LIKES_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}