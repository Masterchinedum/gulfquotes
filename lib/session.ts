import { Role, Permission } from "@/lib/constants/roles";
import { RolePermissions } from "@/lib/constants/roles";

export interface UserSession {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: Role;
}

export interface Session {
  user: UserSession;
  expires: string;
}

export function checkUserHasPermission(session: Session | null, permission: Permission): boolean {
  if (!session?.user?.role) return false;
  return RolePermissions[session.user.role].includes(permission);
}

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "ADMINISTRATOR";
}

export function isAuthor(session: Session | null): boolean {
  return session?.user?.role === "AUTHOR";
}