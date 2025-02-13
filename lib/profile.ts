import { PrismaClient, User, UserProfile } from "@prisma/client";
import slugify from "slugify";

const db = new PrismaClient();

/**
 * Generate a slug for the user based on the given parameters.
 * @param params - The parameters for generating the slug.
 * @returns The generated slug.
 */
export function generateUserSlug(params: {
  username?: string | null;
  name?: string | null;
  userId: string;
}): string {
  const { username, name, userId } = params;

  // Priority 1: Username
  if (username) {
    return slugify(username, { lower: true });
  }

  // Priority 2: First name and last name
  if (name) {
    const nameSlug = slugify(name, { lower: true });
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${nameSlug}-${randomStr}`;
  }

  // Priority 3: Fallback to userId
  return userId;
}

/**
 * Validate the profile update input.
 * @param data - The profile update data.
 * @returns An object containing validation errors, if any.
 */
export function validateProfileInput(data: Partial<UserProfile>) {
  const errors: Record<string, string> = {};

  if (data.username && !/^[a-zA-Z0-9_-]+$/.test(data.username)) {
    errors.username = "Username can only contain letters, numbers, underscores, and hyphens";
  }

  if (data.bio && data.bio.length > 500) {
    errors.bio = "Bio must not exceed 500 characters";
  }

  return errors;
}

/**
 * Check if the user is authorized to update the profile.
 * @param sessionUser - The authenticated user from the session.
 * @param profileUserId - The user ID of the profile being updated.
 * @returns True if the user is authorized, false otherwise.
 */
export function isAuthorizedToUpdateProfile(sessionUser: User, profileUserId: string): boolean {
  return sessionUser.id === profileUserId;
}

/**
 * Update the user profile.
 * @param userId - The ID of the user.
 * @param data - The profile update data.
 * @returns The updated user profile.
 */
export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  // Generate slug if username is provided
  if (data.username) {
    data.slug = generateUserSlug({ username: data.username, userId });
  } else {
    data.slug = generateUserSlug({ userId });
  }

  // Update user profile using transaction
  const updatedUserProfile = await db.userProfile.upsert({
    where: { userId },
    update: data,
    create: { ...data, userId },
  });

  return updatedUserProfile;
}