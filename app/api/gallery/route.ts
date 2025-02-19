import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { galleryService } from "@/lib/services/gallery.service";
import { AppError } from "@/lib/api-error";
import { createGallerySchema } from "@/schemas/gallery";
import type { GalleryResponse, GalleryListResponse } from "@/types/gallery";

export async function GET(
  req: Request
): Promise<NextResponse<GalleryListResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    
    // Filters
    const search = searchParams.get("search")?.trim();
    const isGlobal = searchParams.get("isGlobal") === "true";
    const formats = searchParams.get("formats")?.split(",");
    
    // Sort
    const sortField = (searchParams.get("sortField") || "createdAt");
    const sortDirection = (searchParams.get("sortDirection") || "desc");

    const result = await galleryService.list({
      page,
      limit,
      sort: {
        field: sortField as any,
        direction: sortDirection as any
      },
      filter: {
        search,
        isGlobal,
        formats
      }
    });

    return NextResponse.json({ data: result });

  } catch (error) {
    console.error("[GALLERY_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request
): Promise<NextResponse<GalleryResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = createGallerySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid input data",
            details: validatedData.error.flatten().fieldErrors
          } 
        },
        { status: 400 }
      );
    }

    const gallery = await galleryService.create(validatedData.data);
    return NextResponse.json({ data: gallery });

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("[GALLERY_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}