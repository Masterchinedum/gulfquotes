'use server'

import db from "@/lib/prisma";
import { validateAuthorProfileAccess } from "@/lib/auth/author-profile";
import { auth } from "@/auth";
import { createAuthorProfileSchema, updateAuthorProfileSchema } from "@/lib/auth/author-profile";
import { AppError } from "@/lib/api-error";
import { uploadImage } from "@/lib/uploadImage";
import { AuthorProfileCreateInput } from "@prisma/client";

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
    const formEntries = Object.fromEntries(data.entries());
    console.log('Server action received data:', formEntries);

    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    await validateAuthorProfileAccess({ role: session.user.role });
    
    // Ensure we have the required fields
    if (!formEntries.name || !formEntries.bio || !formEntries.slug) {
      throw new AppError("Missing required fields", "VALIDATION_ERROR", 400);
    }

    const images = formEntries.images ? JSON.parse(formEntries.images as string) : undefined;
    
    const validatedData = createAuthorProfileSchema.safeParse({
      ...formEntries,
      images
    });

    if (!validatedData.success) {
      console.error('Validation errors:', validatedData.error);
      throw new AppError("Invalid data", "VALIDATION_ERROR", 400);
    }

    const authorProfile = await db.authorProfile.create({
      data: validatedData.data as AuthorProfileCreateInput
    });

    return { success: true, data: authorProfile };
  } catch (error) {
    console.error('Server action error:', error);
    return { 
      success: false, 
      error: error instanceof AppError ? error : new AppError(
        "Something went wrong",
        "INTERNAL_ERROR",
        500
      )
    };
  }
}

export async function updateAuthorProfile(id: string, data: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

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
      error: error instanceof AppError ? error : new AppError(
        "Something went wrong",
        "INTERNAL_ERROR",
        500
      )
    };
  }
}