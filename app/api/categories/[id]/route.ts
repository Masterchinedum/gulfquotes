// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import categoryService from "@/lib/services/category.service";
import { AppError } from "@/lib/api-error";
import type { CategoryResponse, CategoryErrorCode } from "@/types/api/categories";

// GET - Fetch single category
export async function GET(
  req: Request,
): Promise<NextResponse<CategoryResponse>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as CategoryErrorCode, message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract ID from URL
    const id = req.url.split('/categories/')[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as CategoryErrorCode, message: "Category ID is required" } },
        { status: 400 }
      );
    }

    // Fetch category
    const category = await categoryService.getById(id);
    return NextResponse.json({ data: category });

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as CategoryErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as CategoryErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PATCH - Update category
export async function PATCH(
  req: Request
): Promise<NextResponse<CategoryResponse>> {
  try {
    // Authentication & authorization
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as CategoryErrorCode, message: "Not authorized" } },
        { status: 401 }
      );
    }

    // Extract ID and body
    const id = req.url.split('/categories/')[1];
    const body = await req.json();

    // Update category
    const updatedCategory = await categoryService.updateCategory(id, body);
    return NextResponse.json({ data: updatedCategory });

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as CategoryErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as CategoryErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}