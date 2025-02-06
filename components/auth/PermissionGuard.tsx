"use client";

import { useSession } from "next-auth/react";
import { Permission } from "@/lib/constants/roles";
import { checkUserHasPermission, type Session } from "@/lib/session";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  fallback
}: PermissionGuardProps) {
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

  if (!checkUserHasPermission(session, permission)) {
    return fallback || null;
  }

  return <>{children}</>;
}