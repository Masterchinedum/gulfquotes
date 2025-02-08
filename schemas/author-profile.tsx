import { z } from "zod";

const authorProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  born: z.string().optional(),
  died: z.string().optional(),
  influences: z.string().optional(),
  bio: z.string().min(1, "Bio is required"),
  slug: z.string().min(1, "Slug is required"),
  images: z.any().optional(), // You might want to be more specific about the image structure
});

export const createAuthorProfileSchema = authorProfileSchema;

export const updateAuthorProfileSchema = authorProfileSchema.extend({
  id: z.string().min(1, "Author profile ID is required"),
}).partial().required({ id: true });