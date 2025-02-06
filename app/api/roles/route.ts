import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role, validateRole } from "@/lib/constants/roles";
import { checkUserHasPermission } from "@/lib/session";
import db from "@/lib/db/db";
import { z } from "zod";

// Input validation schemas
const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMINISTRATOR", "AUTHOR", "USER"]) as z.ZodEnum<[Role, ...Role[]]>
});

// Get all users with their roles
export async function GET(request: Request) {
  const session = await auth();
  
  // Check if user has permission to manage roles
  if (!checkUserHasPermission(session, "MANAGE_ROLES")) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    // Check if specific user is requested
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
      // Get specific user's role
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ user });
    }

    // Get all users with their roles
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to fetch user(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch user(s)" },
      { status: 500 }
    );
  }
}

// Update user role
export async function PUT(request: Request) {
  const session = await auth();

  // Check if user has permission to manage roles
  if (!checkUserHasPermission(session, "MANAGE_ROLES")) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, role } = updateRoleSchema.parse(body);

    // Validate role
    if (!validateRole(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Prevent self-role modification
    if (session?.user?.id === userId) {
      return NextResponse.json(
        { error: "Cannot modify own role" },
        { status: 403 }
      );
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return NextResponse.json({ 
      success: true,
      user: updatedUser 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Failed to update user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}