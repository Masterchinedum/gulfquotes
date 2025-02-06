import { NextResponse } from "next/server";
import { Role, validateRole, validatePermission } from "@/lib/constants/roles";
import { type Session } from "@/lib/session";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUserRole(userRole: unknown): ValidationResult {
  if (!validateRole(userRole)) {
    return {
      isValid: false,
      error: "Invalid role"
    };
  }
  return { isValid: true };
}

export function validateUserPermission(permission: unknown): ValidationResult {
  if (!validatePermission(permission)) {
    return {
      isValid: false,
      error: "Invalid permission"
    };
  }
  return { isValid: true };
}

export function validateAccess(session: Session | null, requiredRole: Role): ValidationResult {
  if (!session?.user) {
    return {
      isValid: false,
      error: "User not authenticated"
    };
  }

  const roleValidation = validateUserRole(session.user.role);
  if (!roleValidation.isValid) {
    return roleValidation;
  }

  if (session.user.role !== requiredRole && session.user.role !== "ADMINISTRATOR") {
    return {
      isValid: false,
      error: "Insufficient privileges"
    };
  }

  return { isValid: true };
}

export function handleValidationError(error: string): NextResponse {
  return new NextResponse(
    JSON.stringify({
      success: false,
      message: error
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" }
    }
  );
}