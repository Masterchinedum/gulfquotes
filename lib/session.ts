import { Role, Permission, hasPermission } from "@/lib/constants/roles";

export interface UserSession {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: Role;
  permissions: Permission[];
}

export interface Session {
  user: UserSession;
  expires: string;
}

export function checkUserHasPermission(session: Session | null, permission: Permission): boolean {
  if (!session?.user?.role) return false;
  return hasPermission(session.user.role, permission);
}

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "ADMINISTRATOR";
}

export function isAuthor(session: Session | null): boolean {
  return session?.user?.role === "AUTHOR";
}