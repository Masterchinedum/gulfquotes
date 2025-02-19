import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { galleryService } from "@/lib/services/gallery.service";
import { AppError } from "@/lib/api-error";
import { updateGallerySchema } from "@/schemas/gallery";
import type { GalleryResponse } from "@/types/gallery";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<GalleryResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const gallery = await galleryService.getById(params.id);
    
    if (!gallery) {
      return NextResponse.json(
        { error: { code: "GALLERY_NOT_FOUND", message: "Gallery item not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: gallery });

  } catch (error) {
    console.error("[GALLERY_GET_BY_ID]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<GalleryResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
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

    const gallery = await galleryService.update(params.id, validatedData.data);
    return NextResponse.json({ data: gallery });

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("[GALLERY_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<GalleryResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    await galleryService.delete(params.id);
    return NextResponse.json({ data: null });

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("[GALLERY_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}