// app/api/authors/[slug]/follow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { authorFollowService } from "@/lib/services/follow";

// Define error codes
export type AuthorErrorCode = 
  | "UNAUTHORIZED" 
  | "RATE_LIMITED" 
  | "NOT_FOUND" 
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"; 

// Define response types
interface FollowResponse {
  data?: {
    followed: boolean;
    followers: number;
  };
  error?: {
    code: AuthorErrorCode;
    message: string;
  };
}

/**
 * GET handler to check if an author is followed by the current user
 */
export async function GET(req: NextRequest): Promise<NextResponse<FollowResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/authors/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid author slug" } },
        { status: 400 }
      );
    }

    // Get the author by slug
    const authorProfile = await db.authorProfile.findUnique({
      where: { slug },
      select: { id: true, followers: true }
    });

    if (!authorProfile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Author not found" } },
        { status: 404 }
      );
    }

    // Check if the user follows this author
    const followed = await authorFollowService.getFollowStatus(
      authorProfile.id,
      session.user.id
    );

    return NextResponse.json({
      data: {
        followed,
        followers: authorProfile.followers
      }
    });
  } catch (error) {
    console.error("[FOLLOW_GET]", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as AuthorErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

/**
 * POST handler to toggle follow status
 */
export async function POST(req: NextRequest): Promise<NextResponse<FollowResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/authors/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid author slug" } },
        { status: 400 }
      );
    }

    // Get the author by slug
    const authorProfile = await db.authorProfile.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!authorProfile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Author not found" } },
        { status: 404 }
      );
    }

    // Toggle follow status
    const result = await authorFollowService.toggleFollow(
      authorProfile.id,
      session.user.id
    );

    return NextResponse.json({
      data: {
        followed: result.followed,
        followers: result.followers
      }
    });
  } catch (error) {
    console.error("[FOLLOW_POST]", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as AuthorErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}