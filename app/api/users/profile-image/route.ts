import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteImage, getImagePublicId } from "@/lib/cloudinary";
import type { ApiResponse } from "@/types/api/users";

export async function DELETE(req: Request): Promise<NextResponse<ApiResponse<null>>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Parse request body
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Image URL is required" } },
        { status: 400 }
      );
    }

    // Get public ID from image URL
    const publicId = getImagePublicId(imageUrl);
    if (!publicId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid image URL" } },
        { status: 400 }
      );
    }

    // Delete image from Cloudinary
    const deletionSuccess = await deleteImage(publicId);
    if (!deletionSuccess) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to delete image" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: null });

  } catch (error) {
    console.error("[PROFILE_IMAGE_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}