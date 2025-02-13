import { PrismaClient } from "@prisma/client";
import { getImagePublicId, deleteImage } from "@/lib/cloudinary";
import type { UpdateProfileData } from "@/types/api/users";

const prisma = new PrismaClient();

export default prisma;

// Helper function to update user profile
export async function updateUserProfile(userId: string, data: UpdateProfileData) {
  // Handle old image cleanup if image is being updated
  if (data.image) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true }
    });

    if (user?.image) {
      const oldImagePublicId = getImagePublicId(user.image);
      if (oldImagePublicId) {
        await deleteImage(oldImagePublicId);
      }
    }
  }

  // Update user profile using transaction
  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: data.image,
        userProfile: {
          update: {
            username: data.username,
            bio: data.bio,
            slug: data.slug,
          },
        },
      },
      include: {
        userProfile: true,
      },
    });

    return updatedUser;
  });
}

// Utility function to delete user profile image
export async function deleteUserProfileImage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true }
  });

  if (user?.image) {
    const publicId = getImagePublicId(user.image);
    if (publicId) {
      await deleteImage(publicId);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { image: null }
    });
  }
}