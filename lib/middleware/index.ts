import { UserRole } from "@prisma/client";
import { createAuthMiddleware, createQuoteOwnershipMiddleware } from "./auth";
import { createValidationMiddleware } from "./validation";
import { composeMiddleware } from "./compose";
import { createQuoteAPISchema } from "@/schemas/quote"; // Changed from createQuoteSchema

export function createQuoteMiddleware(requiredRoles: UserRole[]) {
  return composeMiddleware(
    createAuthMiddleware(requiredRoles),
    createValidationMiddleware(createQuoteAPISchema) // Updated to use createQuoteAPISchema
  );
}

export function createProtectedQuoteMiddleware(quoteId: string, requiredRoles: UserRole[]) {
  return composeMiddleware(
    createAuthMiddleware(requiredRoles),
    createQuoteOwnershipMiddleware(quoteId),
    createValidationMiddleware(createQuoteAPISchema) // Updated to use createQuoteAPISchema
  );
}