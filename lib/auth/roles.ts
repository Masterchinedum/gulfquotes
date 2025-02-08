import { UserRole } from "@prisma/client";

export const REQUIRED_ROLES = {
  CREATE_QUOTE: ["ADMIN", "AUTHOR"] as UserRole[],
  DELETE_QUOTE: ["ADMIN", "AUTHOR"] as UserRole[],
  UPDATE_QUOTE: ["ADMIN", "AUTHOR"] as UserRole[],
  MANAGE_AUTHOR_PROFILE: ["ADMIN", "AUTHOR"] as UserRole[],
  MANAGE_CATEGORIES: ["ADMIN"] as UserRole[],
} as const;

export function hasRequiredRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}