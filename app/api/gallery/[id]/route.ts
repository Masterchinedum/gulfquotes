import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { galleryService } from "@/lib/services/gallery.service";
import { AppError } from "@/lib/api-error";
import { updateGallerySchema } from "@/schemas/gallery";
import type { GalleryResponse, GalleryApiError, GalleryDeleteResponse } from "@/types/gallery";

export async function GET(
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

    // Extract id from URL
    const id = req.url.split('/gallery/')[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Gallery ID is required" } },
        { status: 400 }
      );
    }

    const gallery = await galleryService.getById(id);
    
    if (!gallery) {
      return NextResponse.json(
        { error: { code: "GALLERY_NOT_FOUND", message: "Gallery item not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: gallery });

  } catch (error) {
    if (error instanceof AppError) {
      const galleryError: GalleryApiError = {
        code: error.code,
        message: error.message
      };
      return NextResponse.json(
        { error: galleryError },
        { status: error.statusCode }
      );
    }
    console.error("[GALLERY_GET_BY_ID]", error);
    return NextResponse.json(
      { 
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error"
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Extract id from URL
    const id = req.url.split('/gallery/')[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Gallery ID is required" } },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateGallerySchema.safeParse(body);

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

    const gallery = await galleryService.update(id, validatedData.data);
    return NextResponse.json({ data: gallery });

  } catch (error) {
    if (error instanceof AppError) {
      const galleryError: GalleryApiError = {
        code: error.code,
        message: error.message
      };
      return NextResponse.json(
        { error: galleryError },
        { status: error.statusCode }
      );
    }
    console.error("[GALLERY_PATCH]", error);
    return NextResponse.json(
      { 
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error"
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request
): Promise<NextResponse<GalleryDeleteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const id = req.url.split('/gallery/')[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Gallery ID is required" } },
        { status: 400 }
      );
    }

    await galleryService.delete(id);
    return NextResponse.json({ data: null });

  } catch (error) {
    if (error instanceof AppError) {
      const galleryError: GalleryApiError = {
        code: error.code,
        message: error.message
      };
      return NextResponse.json(
        { error: galleryError },
        { status: error.statusCode }
      );
    }
    console.error("[GALLERY_DELETE]", error);
    return NextResponse.json(
      { 
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error"
        } 
      },
      { status: 500 }
    );
  }
}