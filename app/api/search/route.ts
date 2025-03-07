import { NextResponse } from "next/server";
import { SearchApiResponse, SearchType, SortDirection, SortField } from "@/types/search";
import { searchService } from "@/lib/services/search.service";
// import { sub } from "date-fns";

export async function GET(req: Request): Promise<NextResponse<SearchApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Basic params
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
    
    // Extract filter params
    const categories = searchParams.get("categories")?.split(",").filter(Boolean);
    const authors = searchParams.get("authors")?.split(",").filter(Boolean);
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const featured = searchParams.get("featured") === "true";
    
    // Extract date range params
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    
    // Extract sort params and validate
    const sortField = searchParams.get("sortField") as SortField;
    const sortDirection = searchParams.get("sortDirection") as SortDirection;
    
    if (sortField && !isValidSortField(sortField)) {
      return NextResponse.json({
        error: {
          code: "INVALID_PARAM",
          message: "Invalid sort field"
        }
      }, { status: 400 });
    }
    
    if (sortDirection && !isValidSortDirection(sortDirection)) {
      return NextResponse.json({
        error: {
          code: "INVALID_PARAM",
          message: "Invalid sort direction"
        }
      }, { status: 400 });
    }
    
    // Extract facet params
    const includeCategoryFacets = searchParams.get("includeCategoryFacets") === "true";
    const includeAuthorFacets = searchParams.get("includeAuthorFacets") === "true";
    const includeTagFacets = searchParams.get("includeTagFacets") === "true";
    const includeDateFacets = searchParams.get("includeDateFacets") === "true";
    
    // Extract relevance settings
    const boostExactMatches = searchParams.get("boostExactMatches") === "true";
    const boostTitleMatches = searchParams.get("boostTitleMatches") === "true";
    
    // Prepare search parameters for the search service
    const results = await searchService.search({
      q,
      type: typeParam as SearchType,
      page,
      limit,
      filters: {
        ...(categories && { categories }),
        ...(authors && { authors }),
        ...(tags && { tags }),
        ...(featured && { featured }),
        ...(dateFrom || dateTo) && { 
          dateRange: {
            ...(dateFrom && { from: dateFrom }),
            ...(dateTo && { to: dateTo })
          } 
        },
      },
      sort: sortField ? {
        field: sortField,
        direction: sortDirection || "desc"
      } : undefined,
      includeFacets: (includeCategoryFacets || includeAuthorFacets || includeTagFacets || includeDateFacets) ? {
        categories: includeCategoryFacets,
        authors: includeAuthorFacets,
        tags: includeTagFacets,
        dates: includeDateFacets
      } : undefined,
      relevance: (boostExactMatches || boostTitleMatches) ? {
        boostExactMatches,
        boostTitleMatches
      } : undefined
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

// Helper function to validate sort field
function isValidSortField(field: string): field is SortField {
  return ["relevance", "date", "alphabetical", "popularity"].includes(field);
}

// Helper function to validate sort direction
function isValidSortDirection(direction: string): direction is SortDirection {
  return ["asc", "desc"].includes(direction);
}