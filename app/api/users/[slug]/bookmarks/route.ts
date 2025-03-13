import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { QuotePaginatedResponse } from "@/types/api/quotes";

export async function GET(
  req: Request
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

    // Find user and check permissions
    const user = await db.user.findFirst({
      where: {
        OR: [
          { userProfile: { slug } },
          { userProfile: { username: slug } },
          { id: slug }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Only allow users to see their own bookmarks
    const isCurrentUser = session.user.id === user.id;
    if (!isCurrentUser) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You can only view your own bookmarks" } },
        { status: 403 }
      );
    }

    // Get bookmarked quotes with pagination
    const [bookmarks, total] = await Promise.all([
      db.quoteBookmark.findMany({
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
                  images: {
                    take: 1,
                    select: {
                      url: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      db.quoteBookmark.count({
        where: { userId: user.id }
      })
    ]);

    // Transform the data to match ProfileQuote type
    const items = bookmarks.map(bookmark => ({
      id: bookmark.quote.id,
      content: bookmark.quote.content,
      slug: bookmark.quote.slug,
      backgroundImage: bookmark.quote.backgroundImage,
      createdAt: bookmark.quote.createdAt.toISOString(),
      category: {
        name: bookmark.quote.category.name,
        slug: bookmark.quote.category.slug
      },
      authorProfile: {
        name: bookmark.quote.authorProfile.name,
        slug: bookmark.quote.authorProfile.slug,
        image: bookmark.quote.authorProfile.images[0]?.url || null
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
    console.error("[USER_BOOKMARKS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}