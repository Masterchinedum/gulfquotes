import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { UserResponse } from "@/types/api/users";

export async function GET(
  req: Request,
): Promise<NextResponse<UserResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/users/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid user slug" } },
        { status: 400 }
      );
    }

    // Find user by different identifiers in order of priority
    const user = await db.user.findFirst({
      where: {
        OR: [
          { userProfile: { username: slug } },
          { userProfile: { slug: slug } },
          { id: slug }
        ]
      },
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

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });

  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}