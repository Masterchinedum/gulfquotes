// app/api/public/categories/[slug]/route.ts
import { NextResponse } from "next/server";
import { categoryService } from "@/lib/services/category/category.service";
import { AppError } from "@/lib/api-error";
import type { CategoryApiResponse } from "@/types/category";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
): Promise<NextResponse<CategoryApiResponse>> {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Category slug is required" } },
        { status: 400 }
      );
    }

    const category = await categoryService.getCategoryBySlug(slug);
    return NextResponse.json({ data: category });
  } catch (error) {
    console.error('[PUBLIC_GET_CATEGORY_BY_SLUG]', error);
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