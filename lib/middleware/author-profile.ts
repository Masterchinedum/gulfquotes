import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import { createAuthorProfileSchema, updateAuthorProfileSchema } from "@/schemas/author-profile";
import { NextRequest } from "next/server";

export async function validateAuth(requiredRole: UserRole = "ADMIN") {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (session.user.role !== requiredRole) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }

  return session.user;
}

export async function validateCreateAuthorProfile(req: NextRequest) {
  const body = await req.json();
  const result = createAuthorProfileSchema.safeParse(body);

  if (!result.success) {
    throw new AppError(
      "Invalid input data",
      "VALIDATION_ERROR",
      400,
      result.error.flatten().fieldErrors
    );
  }

  return result.data;
}

export async function validateUpdateAuthorProfile(req: NextRequest) {
  const body = await req.json();
  const result = updateAuthorProfileSchema.safeParse(body);

  if (!result.success) {
    throw new AppError(
      "Invalid input data",
      "VALIDATION_ERROR",
      400,
      result.error.flatten().fieldErrors
    );
  }

  return result.data;
}