import { NextResponse } from "next/server";
import { SearchApiResponse } from "@/types/search";
import { searchService } from "@/lib/services/search.service";

export async function GET(req: Request): Promise<NextResponse<SearchApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    
    if (!q) {
      return NextResponse.json({
        error: {
          code: "INVALID_QUERY",
          message: "Search query is required"
        }
      }, { status: 400 });
    }

    const results = await searchService.search({
      q,
      type,
      page,
      limit
    });

    return NextResponse.json({ data: results });

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