"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { ProfileImageUpload } from "@/components/users/profile-image-upload";
import type { UpdateProfileInput, UserData } from "@/types/api/users";
import { toast } from "sonner";

const updateProfileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional(),
  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .optional(),
  name: z.string()
    .min(1, "Name is required")
    .max(50, "Name must not exceed 50 characters")
    .optional(),
  image: z.string().url().nullable().optional(),
});

export function ProfileEditForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user.userProfile?.username || "",
      bio: user.userProfile?.bio || "",
      name: user.name || "",
      image: user.image || "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("[PROFILE_EDIT_FORM]", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while updating the profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (url: string | null) => {
    form.setValue("image", url || "", { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <Input
            id="name"
            {...form.register("name")}
            disabled={loading}
            className="mt-1"
          />
          {form.formState.errors.name && (
            <p className="mt-2 text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <Input
            id="username"
            {...form.register("username")}
            disabled={loading}
            className="mt-1"
          />
          {form.formState.errors.username && (
            <p className="mt-2 text-sm text-red-600">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <Textarea
            id="bio"
            {...form.register("bio")}
            disabled={loading}
            className="mt-1"
          />
          {form.formState.errors.bio && (
            <p className="mt-2 text-sm text-red-600">
              {form.formState.errors.bio.message}
            </p>
          )}
        </div>

        <ProfileImageUpload
          imageUrl={form.watch("image")}
          onImageChange={handleImageChange}
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}