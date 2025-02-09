// File: app/api/author-profiles/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAuthorProfileSchema } from "@/schemas/author-profile";
import { authorProfileService } from "@/lib/services/author-profile.service";
import type { AuthorProfileResponse, AuthorProfilesResponse } from "@/types/api/author-profiles";
import { DuplicateAuthorProfileError } from "@/lib/services/errors/author-profile.errors";

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

    // Create author profile
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

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}