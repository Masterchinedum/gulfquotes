import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUserHasPermission, type Session, type UserSession } from "@/lib/session";
import db from "@/lib/db/db";

// Get role audit logs
export async function GET() {
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
    const audits = await db.roleAudit.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        modifier: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ audits });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}