import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkUserHasPermission } from "@/lib/session";
import { Permission } from "@/lib/constants/roles";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Define protected paths and their required permissions
  const protectedPaths = new Map<RegExp, Permission>([
    [/^\/admin.*/, "MANAGE_USERS"],
    [/^\/dashboard\/posts\/create.*/, "CREATE_POST"],
    [/^\/dashboard\/posts\/edit.*/, "EDIT_POST"],
  ]);

  // Check if the current path requires permission
  for (const [pathPattern, requiredPermission] of protectedPaths) {
    if (pathPattern.test(request.nextUrl.pathname)) {
      // Cast the session to your custom Session type
      if (!checkUserHasPermission(session as Session | null, requiredPermission)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/posts/:path*",
  ],
};