import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role, validateRole } from "@/lib/constants/roles";
import { checkUserHasPermission, type Session, type UserSession } from "@/lib/session";
import db from "@/lib/db/db";
import { z } from "zod";

// Validation schemas
const roleAssignmentSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMINISTRATOR", "AUTHOR", "USER"]) as z.ZodEnum<[Role, ...Role[]]>,
  reason: z.string().optional()
});

const userRoleQuerySchema = z.object({
  userId: z.string().min(1)
});

// Get user roles
export async function GET(request: Request) {
  const authSession = await auth();
  
  // Convert NextAuth session to our custom Session type
  const session: Session | null = authSession ? {
    user: {
      id: authSession.user?.id ?? '',
      email: authSession.user?.email,
      name: authSession.user?.name,
      image: authSession.user?.image,
      role: (authSession.user as UserSession)?.role ?? 'USER'
    },
    expires: authSession.expires
  } : null;

  if (!checkUserHasPermission(session, "MANAGE_ROLES")) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const { userId } = userRoleQuerySchema.parse({ 
      userId: searchParams.get("userId") 
    });

    const userRole = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });

    if (!userRole) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userRole });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    );
  }
}

// Assign role to user
export async function POST(request: Request) {
  const authSession = await auth();
  
  const session: Session | null = authSession ? {
    user: {
      id: authSession.user?.id ?? '',
      email: authSession.user?.email,
      name: authSession.user?.name,
      image: authSession.user?.image,
      role: (authSession.user as UserSession)?.role ?? 'USER'
    },
    expires: authSession.expires
  } : null;

  if (!checkUserHasPermission(session, "MANAGE_ROLES")) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, role, reason } = roleAssignmentSchema.parse(body);

    // Prevent self-role modification
    if (session?.user?.id === userId) {
      return NextResponse.json(
        { error: "Cannot modify own role" },
        { status: 403 }
      );
    }

    // Validate role
    if (!validateRole(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Update user role with audit
    const [updatedUser, roleAudit] = await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }),
      db.roleAudit.create({
        data: {
          userId,
          oldRole: (await db.user.findUnique({ where: { id: userId } }))?.role ?? 'USER',
          newRole: role,
          modifiedBy: session.user.id,
          reason: reason || 'Role update'
        }
      })
    ]);

    // Here you would typically trigger notifications
    // await notifyUserRoleChange(userId, role);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      audit: roleAudit
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