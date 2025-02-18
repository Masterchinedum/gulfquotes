// schemas/tag.ts

import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string()
    .min(1, "Tag name is required")
    .max(50, "Tag name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Tag name can only contain letters, numbers, spaces, and hyphens")
    .transform(val => val.trim())
});

export type CreateTagInput = z.infer<typeof createTagSchema>;