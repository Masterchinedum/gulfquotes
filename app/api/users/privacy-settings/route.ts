import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { z } from "zod";
import type { ApiResponse } from "@/types/api/users";
import { Prisma } from "@prisma/client";

// Define the privacy settings type
interface PrivacySettingsData {
  showLikes: boolean;
  showBookmarks: boolean;
  showFollowing: boolean;
  showActivity: boolean;
}

// Define the response type
type PrivacySettingsResponse = ApiResponse<PrivacySettingsData>;

// Validation schema for privacy settings
const privacySettingsSchema = z.object({
  showLikes: z.boolean().optional().default(true),
  showBookmarks: z.boolean().optional().default(false),
  showFollowing: z.boolean().optional().default(true),
  showActivity: z.boolean().optional().default(true)
});

/**
 * PATCH - Update user privacy settings
 */
export async function PATCH(
  req: NextRequest
): Promise<NextResponse<PrivacySettingsResponse>> {
  try {
    // 1. Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON payload" } },
        { status: 400 }
      );
    }

    // 3. Validate the privacy settings
    const validationResult = privacySettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid privacy settings",
            details: validationResult.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }

    const privacySettings = validationResult.data;

    // 4. Update the user's privacy settings
    try {
      // First, check if the user profile exists
      const userProfile = await db.userProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!userProfile) {
        // Create user profile if it doesn't exist
        await db.userProfile.create({
          data: {
            userId: session.user.id,
            privacySettings: privacySettings as unknown as Prisma.InputJsonValue,
            slug: session.user.id, // Default slug
          },
        });
      } else {
        // Update existing user profile
        await db.userProfile.update({
          where: { userId: session.user.id },
          data: {
            privacySettings: privacySettings as unknown as Prisma.InputJsonValue,
          },
        });
      }

      // 5. Return the updated settings
      return NextResponse.json({ data: privacySettings });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      return NextResponse.json(
        { error: { code: "DATABASE_ERROR", message: "Failed to update privacy settings" } },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[PRIVACY_SETTINGS_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve user privacy settings
 */
export async function GET(): Promise<NextResponse<PrivacySettingsResponse>> {
  try {
    // 1. Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // 2. Fetch the user's privacy settings
    const userProfile = await db.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        privacySettings: true
      }
    });

    // 3. Return default settings if no user profile or privacySettings exists
    const defaultSettings: PrivacySettingsData = {
      showLikes: true,
      showBookmarks: false,
      showFollowing: true,
      showActivity: true
    };

    const privacySettings = (userProfile?.privacySettings as unknown as PrivacySettingsData) || defaultSettings;

    return NextResponse.json({ data: privacySettings });

  } catch (error) {
    console.error("[PRIVACY_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}