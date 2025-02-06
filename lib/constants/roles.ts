import { z } from "zod";

export const RoleEnum = z.enum(["ADMINISTRATOR", "AUTHOR", "USER"]);
export type Role = z.infer<typeof RoleEnum>;

export const PermissionEnum = z.enum([
  "CREATE_POST",
  "EDIT_POST", 
  "DELETE_POST",
  "MANAGE_USERS",
  "MANAGE_ROLES",
  "VIEW_DASHBOARD",
  "CREATE_COMMENT",
  "EDIT_COMMENT",
  "DELETE_COMMENT"
]);
export type Permission = z.infer<typeof PermissionEnum>;

export const RolePermissions: Record<Role, Permission[]> = {
  ADMINISTRATOR: [
    "CREATE_POST",
    "EDIT_POST",
    "DELETE_POST",
    "MANAGE_USERS",
    "MANAGE_ROLES",
    "VIEW_DASHBOARD",
    "CREATE_COMMENT",
    "EDIT_COMMENT",
    "DELETE_COMMENT"
  ],
  AUTHOR: [
    "CREATE_POST",
    "EDIT_POST",
    "DELETE_POST",
    "VIEW_DASHBOARD",
    "CREATE_COMMENT",
    "EDIT_COMMENT",
    "DELETE_COMMENT"
  ],
  USER: [
    "VIEW_DASHBOARD",
    "CREATE_COMMENT",
    "EDIT_COMMENT"    // Users can edit their own comments
  ]
} as const;

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return RolePermissions[userRole].includes(permission);
}

export function validateRole(role: unknown): role is Role {
  const result = RoleEnum.safeParse(role);
  return result.success;
}

export function validatePermission(permission: unknown): permission is Permission {
  const result = PermissionEnum.safeParse(permission);
  return result.success;
}