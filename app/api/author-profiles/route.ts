// File: app/api/author-profiles/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAuthorProfileSchema } from "@/schemas/author-profile";
import { authorProfileService } from "@/lib/services/author-profile.service";
import type { AuthorProfileResponse, AuthorProfilesResponse } from "@/types/api/author-profiles";
import { DuplicateAuthorProfileError, MaxImagesExceededError } from "@/lib/services/errors/author-profile.errors";
import { cloudinaryConfig } from "@/lib/cloudinary";

// GET handler for listing author profiles
export async function GET(req: Request): Promise<NextResponse<AuthorProfilesResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract pagination parameters
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || undefined;

    const result = await authorProfileService.list({
      page,
      limit,
      search
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[AUTHOR_PROFILES_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST handler for creating new author profiles
export async function POST(req: Request): Promise<NextResponse<AuthorProfileResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Only admin can create author profiles
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createAuthorProfileSchema.safeParse(body);

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

    // Validate images if present
    if (validatedData.data.images && validatedData.data.images.length > 0) {
      // Check maximum number of images
      if (validatedData.data.images.length > cloudinaryConfig.maxFiles) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: `Maximum ${cloudinaryConfig.maxFiles} images allowed`,
            }
          },
          { status: 400 }
        );
      }

      // Verify cloudinary configuration
      if (!cloudinaryConfig.cloudName) {
        return NextResponse.json(
          {
            error: {
              code: "CONFIGURATION_ERROR",
              message: "Cloudinary configuration is missing",
            }
          },
          { status: 500 }
        );
      }

      // Validate each image URL
      for (const image of validatedData.data.images) {
        if (!image.url.includes(cloudinaryConfig.cloudName)) {
          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid image URL. Images must be uploaded to Cloudinary",
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Create author profile with images
    const authorProfile = await authorProfileService.create(validatedData.data);

    return NextResponse.json({ data: authorProfile });

  } catch (error: unknown) {
    console.error("[AUTHOR_PROFILES_POST]", error);

    if (error instanceof DuplicateAuthorProfileError) {
      return NextResponse.json(
        { 
          error: { 
            code: "DUPLICATE_AUTHOR_PROFILE", 
            message: error.message 
          } 
        },
        { status: 400 }
      );
    }

    if (error instanceof MaxImagesExceededError) {
      return NextResponse.json(
        {
          error: {
            code: "MAX_IMAGES_EXCEEDED",
            message: `Maximum ${cloudinaryConfig.maxFiles} images allowed`
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}