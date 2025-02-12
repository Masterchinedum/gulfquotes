import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { slugify } from "@/lib/utils";
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
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});

export async function PATCH(
  req: Request
): Promise<NextResponse<SettingsResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
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

    // Check username uniqueness if updating username
    if (data.username) {
      const existingUser = await db.userProfile.findFirst({
        where: {
          username: data.username,
          user: {
            id: { not: session.user.id }
          }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error: {
              code: "BAD_REQUEST",
              message: "Username already taken"
            }
          },
          { status: 400 }
        );
      }
    }

    // Generate slug if username is provided
    const updateData: Partial<{ username: string; bio: string; slug: string }> = { 
      ...data,
      ...(data.username && { slug: slugify(data.username) })
    };

    // Update user profile using transaction
    const updatedUser = await db.$transaction(async (tx) => {
      // Create profile if it doesn't exist
      await tx.userProfile.upsert({
        where: {
          userId: session.user.id
        },
        update: updateData,
        create: {
          ...updateData,
          userId: session.user.id,
          // Ensure slug is always a string for create operation
          slug: updateData.slug ?? slugify(session.user.id)
        }
      });

      // Return user with updated profile
      return await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          userProfile: {
            select: {
              username: true,
              bio: true,
              slug: true
            }
          }
        }
      });
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedUser });

  } catch (error) {
    console.error("[USER_SETTINGS_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}