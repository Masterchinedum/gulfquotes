import { z } from "zod";

// Constants for validation
const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 500;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
] as const;

// Helper function to validate Cloudinary URLs
const isCloudinaryUrl = (url: string) => {
  return url.startsWith('https://res.cloudinary.com/');
};

// Main profile schema
export const profileSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(MAX_NAME_LENGTH, `Name must not exceed ${MAX_NAME_LENGTH} characters`)
    .transform((name) => name.trim())
    .optional(),
    
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    )
    .optional(),
    
  bio: z.string()
    .max(MAX_BIO_LENGTH, `Bio must not exceed ${MAX_BIO_LENGTH} characters`)
    .transform((bio) => bio.trim())
    .optional(),
    
  image: z.union([
    z.string()
      .url("Invalid image URL")
      .refine(
        isCloudinaryUrl,
        "Image must be uploaded to Cloudinary"
      ),
    z.null()
  ]).optional(),
}).refine((data) => {
  // Ensure at least one field is provided
  return Object.keys(data).length > 0;
}, {
  message: "At least one field must be provided"
});

// Export type
export type ProfileFormData = z.infer<typeof profileSchema>;

// Validation schema for image uploads
export const profileImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Public ID is required"),
  format: z.enum(ALLOWED_IMAGE_TYPES, {
    description: "Must be a valid image format"
  }),
  width: z.number().positive("Width must be positive"),
  height: z.number().positive("Height must be positive"),
});

export type ProfileImageData = z.infer<typeof profileImageSchema>;