// File: app/api/author-profiles/[slug]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateAuthorProfileSchema } from "@/schemas/author-profile";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { 
  AuthorProfileNotFoundError, 
  MaxImagesExceededError,
  InvalidImageError 
} from "@/lib/services/errors/author-profile.errors";
import { cloudinaryConfig, getMaxFiles } from "@/lib/cloudinary";
import type { AuthorProfileResponse } from "@/types/api/author-profiles";

export async function GET(req: Request) {
  try {
    const slug = req.url.split('/author-profiles/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json({ 
        error: { code: "BAD_REQUEST", message: "Invalid author profile slug" }
      }, { status: 400 });
    }

    const authorProfile = await authorProfileService.getBySlug(slug);
    if (!authorProfile) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Author profile not found" }
      }, { status: 404 });
    }

    return NextResponse.json({ data: authorProfile });
  } catch (error) {
    console.error("[AUTHOR_PROFILE_GET]", error);
    return NextResponse.json({ 
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    }, { status: 500 });
  }
}

export async function PATCH(req: Request): Promise<NextResponse<AuthorProfileResponse>> {
  try {
    // Auth checks
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Permission denied" }
      }, { status: 403 });
    }

    // Get slug from URL
    const slug = req.url.split('/author-profiles/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json({ 
        error: { code: "BAD_REQUEST", message: "Invalid author profile slug" }
      }, { status: 400 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateAuthorProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ 
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: validatedData.error.flatten().fieldErrors
        }
      }, { status: 400 });
    }

    // Validate images if present
    if (validatedData.data.images?.length) {
      // Check maximum images using the helper function
      if (validatedData.data.images.length > getMaxFiles('authors')) {
        return NextResponse.json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Maximum ${getMaxFiles('authors')} images allowed`
          }
        }, { status: 400 });
      }

      // Validate each image URL
      for (const image of validatedData.data.images) {
        // Check if cloudinaryConfig.cloudName exists
        if (!cloudinaryConfig.cloudName) {
          return NextResponse.json({
            error: {
              code: "CONFIGURATION_ERROR",
              message: "Cloudinary configuration is missing"
            }
          }, { status: 500 });
        }

        if (!image.url.includes(cloudinaryConfig.cloudName)) {
          return NextResponse.json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid image URL. Images must be uploaded to Cloudinary"
            }
          }, { status: 400 });
        }
      }
    }

    // Get existing profile
    const authorProfile = await authorProfileService.getBySlug(slug);
    if (!authorProfile) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Author profile not found" }
      }, { status: 404 });
    }

    // Update profile with validated data
    const updatedProfile = await authorProfileService.update(
      authorProfile.id,
      validatedData.data
    );

    return NextResponse.json({ data: updatedProfile });

  } catch (error) {
    console.error("[AUTHOR_PROFILE_PATCH]", error);
    
    if (error instanceof AuthorProfileNotFoundError) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: error.message }
      }, { status: 404 });
    }

    if (error instanceof MaxImagesExceededError) {
      return NextResponse.json({
        error: {
          code: "MAX_IMAGES_EXCEEDED",
          message: error.message
        }
      }, { status: 400 });
    }

    if (error instanceof InvalidImageError) {
      return NextResponse.json({
        error: {
          code: "INVALID_IMAGE",
          message: error.message
        }
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Permission denied" }
      }, { status: 403 });
    }

    const slug = req.url.split('/author-profiles/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json({ 
        error: { code: "BAD_REQUEST", message: "Invalid author profile slug" }
      }, { status: 400 });
    }

    const authorProfile = await authorProfileService.getBySlug(slug);
    if (!authorProfile) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Author profile not found" }
      }, { status: 404 });
    }

    const deletedProfile = await authorProfileService.delete(authorProfile.id);
    return NextResponse.json({ data: deletedProfile });
  } catch (error) {
    console.error("[AUTHOR_PROFILE_DELETE]", error);

    if (error instanceof AuthorProfileNotFoundError) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: error.message }
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    }, { status: 500 });
  }
}