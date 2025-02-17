import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { generateUserSlug } from "@/lib/utils";
// import { deleteImage, getImagePublicId } from "@/lib/cloudinary";
import type { SettingsResponse } from "@/types/api/users";
import { z } from "zod";

// Validation schema
const updateProfileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional(),
  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .optional(),
  name: z.string()
    .min(1, "Name is required")
    .max(50, "Name must not exceed 50 characters")
    .optional(),
  image: z.string()
    .url("Invalid image URL")
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});

export async function PATCH(
  req: Request
): Promise<NextResponse<SettingsResponse>> {
  try {
    // 1. Check authentication
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
    } catch {  // Remove the unused parameter completely
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON payload" } },
        { status: 400 }
      );
    }

    // 3. Validate input data
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Invalid input data",
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const userId = session.user.id;

    // 4. Perform update transaction
    try {
      const updatedUser = await db.$transaction(async (tx) => {
        // Handle profile update
        await tx.userProfile.upsert({
          where: { userId },
          create: {
            userId,
            username: data.username,
            bio: data.bio,
            slug: generateUserSlug({
              username: data.username,
              firstName: session.user.name?.split(' ')[0] || null,
              lastName: session.user.name?.split(' ').slice(1).join(' ') || null,
              userId
            })
          },
          update: {
            username: data.username,
            bio: data.bio,
            slug: generateUserSlug({
              username: data.username,
              firstName: session.user.name?.split(' ')[0] || null,
              lastName: session.user.name?.split(' ').slice(1).join(' ') || null,
              userId
            })
          }
        });

        // Handle name update if provided
        if (data.name) {
          await tx.user.update({
            where: { id: userId },
            data: { name: data.name }
          });
        }

        // Return complete updated user data
        const updatedUserData = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userProfile: {
              select: {
                username: true,
                bio: true,
                slug: true
              }
            }
          }
        });

        return updatedUserData;
      });

      if (!updatedUser) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Failed to update user" } },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: updatedUser });

    } catch (error) {
      console.error("[TRANSACTION_ERROR]", error);
      if (error instanceof Error) {
        return NextResponse.json(
          { error: { code: "TRANSACTION_ERROR", message: error.message } },
          { status: 500 }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error("[USER_SETTINGS_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}