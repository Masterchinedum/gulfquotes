import { UserRole } from "@prisma/client";
import { AppError } from "@/lib/api-error";
import { hasRequiredRole } from "@/lib/auth/roles";
import { z } from "zod";

export class AuthorProfileAccessError extends AppError {
  constructor(message: string = "You don't have permission to manage author profiles") {
    super(message, "AUTHOR_PROFILE_ACCESS_DENIED", 403);
  }
}

// Update to accept just the role instead of full user
export function canManageAuthorProfile(role?: UserRole): boolean {
  return hasRequiredRole(role, ["ADMIN", "AUTHOR"]);
}

// Update to accept session user type
export async function validateAuthorProfileAccess(user: {
  role: UserRole;
}): Promise<void> {
  if (!canManageAuthorProfile(user.role)) {
    throw new AuthorProfileAccessError();
  }
}

const authorProfileSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  born: z.string()
    .min(1, "Birth information must not be empty")
    .optional(),
  died: z.string()
    .min(1, "Death information must not be empty")
    .optional(),
  influences: z.string()
    .min(1, "Influences must not be empty")
    .optional(),
  bio: z.string()
    .min(50, "Bio must be at least 50 characters")
    .max(10000, "Bio must not exceed 10000 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly"),
  images: z.object({
    profile: z.string().url("Profile image must be a valid URL").optional(),
    gallery: z.array(z.string().url("Gallery images must be valid URLs")).optional(),
  }).optional(),
});

// Schema for creating a new author profile
export const createAuthorProfileSchema = authorProfileSchema;

// Schema for updating an existing author profile
// Makes all fields optional except id, which is required
export const updateAuthorProfileSchema = authorProfileSchema.extend({
  id: z.string().min(1, "Author profile ID is required"),
}).partial().required({ id: true });

// TypeScript types
export type AuthorProfile = z.infer<typeof authorProfileSchema>;
export type CreateAuthorProfileInput = z.infer<typeof createAuthorProfileSchema>;
export type UpdateAuthorProfileInput = z.infer<typeof updateAuthorProfileSchema>;