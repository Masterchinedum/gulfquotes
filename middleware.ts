import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkUserHasPermission, type Session, type UserSession } from "@/lib/session";
import { Permission, Role } from "@/lib/constants/roles";

// Define protected route configurations
interface RouteConfig {
  path: RegExp;
  permissions: Permission[];
  roles?: Role[];
}

const protectedRoutes: RouteConfig[] = [
  {
    path: /^\/admin.*/,
    permissions: ["MANAGE_USERS", "MANAGE_ROLES"],
    roles: ["ADMINISTRATOR"]
  },
  {
    path: /^\/dashboard\/posts\/create.*/,
    permissions: ["CREATE_POST"],
    roles: ["ADMINISTRATOR", "AUTHOR"]
  },
  {
    path: /^\/dashboard\/posts\/edit.*/,
    permissions: ["EDIT_POST"],
    roles: ["ADMINISTRATOR", "AUTHOR"]
  },
  {
    path: /^\/dashboard.*/,
    permissions: ["VIEW_DASHBOARD"]
  }
];

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Public routes - allow access
  const publicRoutes = ["/login", "/sign-up", "/error"];
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Check if user is authenticated and has role
  if (!session?.user?.role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Type assertion since we've verified the session structure
  const userSession = session.user as UserSession;

  // Check route permissions
  for (const route of protectedRoutes) {
    if (route.path.test(request.nextUrl.pathname)) {
      // Check role-based access
      if (route.roles && !route.roles.includes(userSession.role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      // Check permission-based access
      const hasRequiredPermission = route.permissions.some(permission =>
        checkUserHasPermission(session as Session, permission)
      );

      if (!hasRequiredPermission) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/posts/:path*"
  ]
};