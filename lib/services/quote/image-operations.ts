import { AppError } from "@/lib/api-error";
import { cloudinaryConfig } from "@/lib/cloudinary";
import { deleteImage } from "@/lib/cloudinary";
import { handleDeleteError, handleUploadError } from "@/lib/utils/image-management";
// import { mediaService } from "@/lib/services/media.service";
import db from "@/lib/prisma";
import type { QuoteImageData } from "./types";
import type { MediaLibraryItem } from "@/types/cloudinary";
import type { Quote } from "@prisma/client";
import type { GalleryItem } from "@/types/gallery";

export async function addImages(quoteId: string, images: QuoteImageData[]): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      // Update to use quoteToGallery instead of quoteImage
      const currentCount = await tx.quoteToGallery.count({
        where: { quoteId }
      });

      if (currentCount + images.length > cloudinaryConfig.limits.quotes.maxFiles) {
        throw new AppError(
          `Adding these images would exceed the maximum limit of ${cloudinaryConfig.limits.quotes.maxFiles} images`,
          "MAX_IMAGES_EXCEEDED",
          400
        );
      }

      // Create gallery items first
      const galleryItems = await Promise.all(
        images.map(img => 
          tx.gallery.create({
            data: {
              url: img.url,
              publicId: img.publicId,
              format: img.format,
              width: img.width,
              height: img.height,
              bytes: img.bytes,
              title: img.title,
              description: img.description,
              altText: img.altText,
              isGlobal: img.isGlobal ?? false,
              usageCount: 1
            }
          })
        )
      );

      // Create quote associations
      await Promise.all(
        galleryItems.map(gallery =>
          tx.quoteToGallery.create({
            data: {
              quoteId,
              galleryId: gallery.id,
              isActive: false
            }
          })
        )
      );

      return tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      });
    });
  } catch (error) {
    handleUploadError(error);
  }
}

export async function addFromMediaLibrary(quoteId: string, images: MediaLibraryItem[]): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      // Update to use quoteToGallery instead of quoteImage
      const currentCount = await tx.quoteToGallery.count({
        where: { quoteId }
      });

      if (currentCount + images.length > cloudinaryConfig.limits.quotes.maxFiles) {
        throw new AppError(
          `Adding these images would exceed the maximum limit`,
          "MAX_IMAGES_EXCEEDED",
          400
        );
      }

      // Create associations for media library items
      for (const image of images) {
        // Create association with existing gallery item
        await tx.quoteToGallery.create({
          data: {
            quoteId,
            galleryId: image.id,
            isActive: false
          }
        });

        // Increment usage count for the gallery item
        await tx.gallery.update({
          where: { id: image.id },
          data: { usageCount: { increment: 1 } }
        });
      }

      return tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      });
    });
  } catch (error) {
    handleUploadError(error);
  }
}

export async function removeImage(quoteId: string, publicId: string): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      // Find the gallery item by publicId
      const galleryImage = await tx.gallery.findFirst({
        where: { publicId },
        include: {
          quotes: {
            where: { quoteId }
          }
        }
      });

      if (!galleryImage || galleryImage.quotes.length === 0) {
        throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
      }

      if (galleryImage.isGlobal) {
        // Just remove the association for global images
        await tx.quoteToGallery.delete({
          where: {
            quoteId_galleryId: {
              quoteId,
              galleryId: galleryImage.id
            }
          }
        });

        // Decrement usage count
        await tx.gallery.update({
          where: { id: galleryImage.id },
          data: { usageCount: { decrement: 1 } }
        });
      } else {
        // For non-global images, delete from Cloudinary and database
        const deleted = await deleteImage(publicId);
        if (!deleted) {
          throw new AppError("Failed to delete image", "IMAGE_DELETE_FAILED", 500);
        }

        // Remove gallery item and all its associations
        await tx.quoteToGallery.deleteMany({
          where: { galleryId: galleryImage.id }
        });

        await tx.gallery.delete({
          where: { id: galleryImage.id }
        });
      }

      // Return updated quote
      return tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      });
    });
  } catch (error) {
    handleDeleteError(error);
  }
}

export async function setBackgroundImage(quoteId: string, imageUrl: string | null): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      // Reset all gallery associations to not active
      await tx.quoteToGallery.updateMany({
        where: { quoteId },
        data: { isActive: false }
      });

      if (imageUrl) {
        // Find the gallery item by URL
        const gallery = await tx.gallery.findFirst({
          where: { url: imageUrl }
        });

        if (!gallery) {
          throw new AppError("Gallery image not found", "GALLERY_NOT_FOUND", 404);
        }

        // Set the selected image as active
        await tx.quoteToGallery.update({
          where: {
            quoteId_galleryId: { quoteId, galleryId: gallery.id }
          },
          data: { isActive: true }
        });
      }

      // Update quote's background image
      return tx.quote.update({
        where: { id: quoteId },
        data: { backgroundImage: imageUrl },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to set background image", "GALLERY_QUOTE_OPERATION_FAILED", 500);
  }
}

export async function removeImageAssociation(quoteId: string, imageId: string): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      const image = await tx.quoteImage.findFirst({
        where: { id: imageId, quoteId }
      });

      if (!image) {
        throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
      }

      // If this is the active background, reset it
      if (image.isActive) {
        await tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: null }
        });
      }

      // Remove the association
      await tx.quoteImage.delete({
        where: { id: imageId }
      });

      // Update usage count for global images
      if (image.isGlobal) {
        await tx.quoteImage.updateMany({
          where: { publicId: image.publicId },
          data: { usageCount: { decrement: 1 } }
        });
      }

      return tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: {
          images: true,
          category: true,
          authorProfile: true
        }
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to remove image association",
      "IMAGE_ASSOCIATION_REMOVE_FAILED",
      500
    );
  }
}

/**
 * Add gallery images to a quote
 */
export async function addGalleryImages(quoteId: string, images: GalleryItem[]): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      const currentCount = await tx.quoteToGallery.count({
        where: { quoteId }
      });

      if (currentCount + images.length > cloudinaryConfig.limits.quotes.maxFiles) {
        throw new AppError(
          `Adding these images would exceed the maximum limit of ${cloudinaryConfig.limits.quotes.maxFiles} images`,
          "MAX_IMAGES_EXCEEDED",
          400
        );
      }

      // Create gallery associations
      for (const image of images) {
        await tx.quoteToGallery.create({
          data: {
            quoteId,
            galleryId: image.id,
            isActive: false
          }
        });
      }

      return tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      });
    });
  } catch (error) {
    handleUploadError(error);
  }
}

/**
 * Remove a gallery image from a quote
 */
export async function removeGalleryImage(quoteId: string, galleryId: string): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      const association = await tx.quoteToGallery.findUnique({
        where: {
          quoteId_galleryId: { quoteId, galleryId }
        },
        include: {
          gallery: true
        }
      });

      if (!association) {
        throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
      }

      // If this was the background image, reset it
      if (association.isActive) {
        await tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: null }
        });
      }

      // Remove the association
      await tx.quoteToGallery.delete({
        where: {
          quoteId_galleryId: { quoteId, galleryId }
        }
      });

      // Decrement usage count
      await tx.gallery.update({
        where: { id: galleryId },
        data: { usageCount: { decrement: 1 } }
      });

      return tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to remove gallery image",
      "GALLERY_QUOTE_OPERATION_FAILED",
      500
    );
  }
}

/**
 * Set a gallery image as the quote background
 */
export async function setGalleryBackground(quoteId: string, galleryId: string | null): Promise<Quote> {
  try {
    return await db.$transaction(async (tx) => {
      // Reset all images to not active
      await tx.quoteToGallery.updateMany({
        where: { quoteId },
        data: { isActive: false }
      });

      if (galleryId) {
        const gallery = await tx.gallery.findUnique({
          where: { id: galleryId }
        });

        if (!gallery) {
          throw new AppError("Gallery image not found", "GALLERY_NOT_FOUND", 404);
        }

        // Set the selected image as active and update background
        await tx.quoteToGallery.update({
          where: {
            quoteId_galleryId: { quoteId, galleryId }
          },
          data: { isActive: true }
        });

        await tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: gallery.url }
        });
      } else {
        // Just reset the background if galleryId is null
        await tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: null }
        });
      }

      return tx.quote.findUniqueOrThrow({
        where: { id: quoteId },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to set background image",
      "GALLERY_QUOTE_OPERATION_FAILED",
      500
    );
  }
}
