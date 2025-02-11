import { NextResponse } from "next/server";
import { SearchApiResponse, SearchType } from "@/types/search";
import db from "@/lib/prisma";

export async function GET(req: Request): Promise<NextResponse<SearchApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract and validate search parameters
    const q = searchParams.get("q")?.trim();
    const type = (searchParams.get("type") as SearchType) || "all";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    
    // Validate search query
    if (!q) {
      return NextResponse.json({
        error: {
          code: "INVALID_QUERY",
          message: "Search query is required"
        }
      }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Basic search implementation
    const [quotes, authors, users] = await Promise.all([
      type === "all" || type === "quotes"
        ? db.quote.findMany({
            where: {
              OR: [
                { content: { contains: q, mode: 'insensitive' } },
                { authorProfile: { name: { contains: q, mode: 'insensitive' } } }
              ]
            },
            include: {
              authorProfile: true,
              category: true
            },
            skip,
            take: limit,
          })
        : [],

      type === "all" || type === "authors"
        ? db.authorProfile.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } }
              ]
            },
            skip,
            take: limit,
          })
        : [],

      type === "all" || type === "users"
        ? db.user.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
              ]
            },
            select: {
              id: true,
              name: true,
              image: true,
            },
            skip,
            take: limit,
          })
        : []
    ]);

    // Transform results to match SearchResult type
    const results = [
      ...quotes.map(quote => ({
        id: quote.id,
        type: "quotes" as const,
        matchedOn: "content",
        score: 1, // Basic score for now
        data: {
          content: quote.content,
          slug: quote.slug,
          authorName: quote.authorProfile.name,
          category: quote.category.name
        }
      })),
      ...authors.map(author => ({
        id: author.id,
        type: "authors" as const,
        matchedOn: "name",
        score: 1,
        data: {
          name: author.name,
          slug: author.slug,
          bio: author.bio
        }
      })),
      ...users.map(user => ({
        id: user.id,
        type: "users" as const,
        matchedOn: "name",
        score: 1,
        data: {
          name: user.name || "",
          image: user.image
        }
      }))
    ];

    // Calculate total (basic implementation)
    const total = results.length;
    const hasMore = total > limit;

    return NextResponse.json({
      data: {
        results: results.slice(0, limit),
        total,
        page,
        limit,
        hasMore
      }
    });

  } catch (error) {
    console.error("[SEARCH]", error);
    return NextResponse.json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to perform search"
      }
    }, { status: 500 });
  }
}