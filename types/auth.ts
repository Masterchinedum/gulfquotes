import { z } from "zod";
import { Role, Permission } from "@/lib/constants/roles";

// Role-based validation types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Auth session types
export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  permissions: Permission[];
}

// Extended Session type
export interface Session {
  user: UserSession;
  expires: string;
}

// Role validation response
export interface RoleValidationResponse {
  success: boolean;
  message: string;
  data?: {
    role?: Role;
    permissions?: Permission[];
  };
}

// Permission check request
export interface PermissionCheckRequest {
  userId: string;
  permission: Permission;
}

// Role assignment request
export interface RoleAssignmentRequest {
  userId: string;
  role: Role;
}

// Auth error response
export interface AuthErrorResponse {
  success: false;
  message: string;
  statusCode: number;
}

// Auth success response
export interface AuthSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

// Role validation schema
export const roleValidationSchema = z.object({
  role: z.enum(["ADMINISTRATOR", "AUTHOR", "USER"]),
  permissions: z.array(z.enum([
    "CREATE_POST",
    "EDIT_POST", 
    "DELETE_POST",
    "MANAGE_USERS",
    "MANAGE_ROLES",
    "VIEW_DASHBOARD"
  ]))
});