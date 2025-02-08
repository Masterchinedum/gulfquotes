import { User } from "@prisma/client";
import { AppError } from "@/lib/api-error";
import { hasRequiredRole } from "@/lib/auth/roles";

export class AuthorProfileAccessError extends AppError {
  constructor(message: string = "You don't have permission to manage author profiles") {
    super(message, "AUTHOR_PROFILE_ACCESS_DENIED", 403);
  }
}

export function canManageAuthorProfile(user: User): boolean {
  return hasRequiredRole(user.role, ["ADMIN", "AUTHOR"]);
}

export async function validateAuthorProfileAccess(user: User): Promise<void> {
  if (!canManageAuthorProfile(user)) {
    throw new AuthorProfileAccessError();
  }
}