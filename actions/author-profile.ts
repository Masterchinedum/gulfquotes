'use server'

import db from "@/lib/prisma";
import { validateAuthorProfileAccess } from "@/lib/auth/author-profile";
import { auth } from "@/auth";
import { createAuthorProfileSchema, updateAuthorProfileSchema } from "@/lib/auth/author-profile";
import { AppError } from "@/lib/api-error";
import { uploadImage } from "@/lib/uploadImage";

async function handleImageUploads(data: FormData) {
  const profileImage = data.get('profile') as File;
  const galleryImages = data.getAll('gallery') as File[];
  
  const images = {
    profile: profileImage?.size > 0 ? await uploadImage(profileImage) : undefined,
    gallery: await Promise.all(
      galleryImages
        .filter(file => file.size > 0)
        .map(file => uploadImage(file))
    )
  };

  return images;
}

export async function createAuthorProfile(data: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Pass just the user with role
    await validateAuthorProfileAccess({ role: session.user.role });
    
    const images = await handleImageUploads(data);
    
    const validatedData = createAuthorProfileSchema.safeParse({
      ...Object.fromEntries(data),
      images
    });

    if (!validatedData.success) {
      throw new AppError("Invalid data", "VALIDATION_ERROR", 400);
    }

    const authorProfile = await db.authorProfile.create({
      data: validatedData.data
    });

    return { success: true, data: authorProfile };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof AppError ? error : new AppError("Something went wrong") 
    };
  }
}

export async function updateAuthorProfile(id: string, data: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Pass just the user with role
    await validateAuthorProfileAccess({ role: session.user.role });
    
    const images = await handleImageUploads(data);
    
    const validatedData = updateAuthorProfileSchema.safeParse({
      ...Object.fromEntries(data),
      images,
      id
    });

    if (!validatedData.success) {
      throw new AppError("Invalid data", "VALIDATION_ERROR", 400);
    }

    const authorProfile = await db.authorProfile.update({
      where: { id },
      data: validatedData.data
    });

    return { success: true, data: authorProfile };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof AppError ? error : new AppError("Something went wrong") 
    };
  }
}