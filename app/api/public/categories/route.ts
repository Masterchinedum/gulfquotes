// app/api/public/categories/route.ts
import { NextResponse } from "next/server";
import { categoryService } from "@/lib/services/category/category.service";
import type { CategoriesApiResponse } from "@/types/category";
import { AppError } from "@/lib/api-error";

export async function GET(
  req: Request
): Promise<NextResponse<CategoriesApiResponse>> {
  try {
    // Extract query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const search = url.searchParams.get("search") || undefined;
    const sortBy = url.searchParams.get("sortBy") as "name" | "popular" | "recent" || "name";
    const order = url.searchParams.get("order") as "asc" | "desc" || "asc";
    
    // Get categories using our service (no auth check)
    const categories = await categoryService.getAllCategories({
      page,
      limit,
      search,
      sortBy,
      order
    });
    
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('[PUBLIC_GET_CATEGORIES]', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}