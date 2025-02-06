"use client";

import { useSession } from "next-auth/react";
import { Role, Permission } from "@/lib/constants/roles";
import { checkUserHasPermission, type Session } from "@/lib/session";
import { redirect } from "next/navigation";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback
}: RoleGuardProps) {
  const { data: authSession } = useSession();
  
  // Convert NextAuth session to our custom Session type
  const session: Session | null = authSession ? {
    user: {
      id: authSession.user?.id ?? '',
      email: authSession.user?.email,
      name: authSession.user?.name,
      image: authSession.user?.image,
      role: authSession.user?.role ?? 'USER'
    },
    expires: authSession.expires
  } : null;

  // Check role-based access
  if (allowedRoles && (!session?.user?.role || !allowedRoles.includes(session.user.role))) {
    if (fallback) {
      return fallback;
    }
    redirect('/unauthorized'); // Redirect to unauthorized page
  }

  // Check permission-based access
  if (requiredPermission && !checkUserHasPermission(session, requiredPermission)) {
    if (fallback) {
      return fallback;
    }
    redirect('/unauthorized'); // Redirect to unauthorized page
  }

  return <>{children}</>;
}