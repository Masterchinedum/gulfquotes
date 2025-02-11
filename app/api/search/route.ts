import { NextResponse } from "next/server";
import { SearchApiResponse, SearchType } from "@/types/search";
import { searchService } from "@/lib/services/search.service";

export async function GET(req: Request): Promise<NextResponse<SearchApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    const q = searchParams.get("q")?.trim();
    const typeParam = searchParams.get("type") || "all";
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

    // Validate search type
    if (!isValidSearchType(typeParam)) {
      return NextResponse.json({
        error: {
          code: "INVALID_TYPE",
          message: "Invalid search type"
        }
      }, { status: 400 });
    }

    const results = await searchService.search({
      q,
      type: typeParam as SearchType,
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

// Helper function to validate search type
function isValidSearchType(type: string): type is SearchType {
  return ["all", "quotes", "authors", "users"].includes(type);
}