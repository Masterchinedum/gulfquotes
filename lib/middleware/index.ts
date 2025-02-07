import { UserRole } from "@prisma/client";
import { createAuthMiddleware } from "./auth";
import { createValidationMiddleware } from "./validation";
import { composeMiddleware } from "./compose";
import { createQuoteSchema } from "@/schemas/quote";

export function createQuoteMiddleware(requiredRoles: UserRole[]) {
  return composeMiddleware(
    createAuthMiddleware(requiredRoles),
    createValidationMiddleware(createQuoteSchema)
  );
}

export function createProtectedQuoteMiddleware(quoteId: string, requiredRoles: UserRole[]) {
  return composeMiddleware(
    createAuthMiddleware(requiredRoles),
    createQuoteOwnershipMiddleware(quoteId),
    createValidationMiddleware(createQuoteSchema)
  );
}