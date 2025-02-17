import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma"; // Fixed import
import { profileSchema as updateProfileSchema } from "@/schemas/profile"; // Use existing schema
import { generateUserSlug } from "@/lib/utils";
import { deleteImage, getImagePublicId } from "@/lib/cloudinary";
import type { SettingsResponse } from "@/types/api/users";

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
    } catch {
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
        // Handle old image cleanup if image is being updated
        if (data.image !== undefined) {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { image: true }
          });

          if (user?.image && user.image !== data.image) {
            const oldImagePublicId = getImagePublicId(user.image);
            if (oldImagePublicId) {
              await deleteImage(oldImagePublicId);
            }
          }
        }

        // Handle image deletion
        if (data.image === null) {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { image: true }
          });

          if (user?.image) {
            const oldImagePublicId = getImagePublicId(user.image);
            if (oldImagePublicId) {
              await deleteImage(oldImagePublicId);
            }
          }
        }

        // Update user and profile
        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            name: data.name,
            image: data.image,
            userProfile: {
              upsert: {
                create: {
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
              }
            }
          },
          include: {
            userProfile: true
          }
        });

        return updated;
      });

      return NextResponse.json({ data: updatedUser });

    } catch (error) {
      console.error("[TRANSACTION_ERROR]", error);
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