import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/auth/roles";
import { validateQuoteOwnership } from "@/lib/auth/ownership";
import { AppError } from "@/lib/api-error";

export function createAuthMiddleware(requiredRoles: UserRole[]) {
  return async function authMiddleware() {
    const session = await auth();
    
    if (!session?.user) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasRequiredRole(session.user.role as UserRole, requiredRoles)) {
      throw new AppError("Permission denied", "FORBIDDEN", 403);
    }
  };
}

export function createQuoteOwnershipMiddleware(quoteId: string) {
  return async function ownershipMiddleware() {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const hasAccess = await validateQuoteOwnership(quoteId, session.user.id);
    
    if (!hasAccess && session.user.role !== "ADMIN") {
      throw new AppError("You don't have permission to manage this quote", "QUOTE_ACCESS_DENIED", 403);
    }
  };
}