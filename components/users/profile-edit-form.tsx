"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
// import { ProfileImageUpload } from "@/components/users/profile-image-upload";
import type { UpdateProfileInput, UserData } from "@/types/api/users";

// Validation schema
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
  image: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});

interface ProfileEditFormProps {
  user: UserData;
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user.userProfile?.username || "",
      bio: user.userProfile?.bio || "",
      name: user.name || "",
      // image: user.image || "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { image, ...updateData } = data;
      const response = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      setSuccessMessage("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("[PROFILE_EDIT_FORM]", error);
      if (error instanceof Error) {
        setErrorMessage(error.message || "An error occurred while updating the profile.");
      } else {
        setErrorMessage("An unknown error occurred while updating the profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  // const handleImageChange = (url: string | null) => {
  //   setValue("image", url || "");
  // };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {successMessage && (
        <div className="text-green-600">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="text-red-600">
          {errorMessage}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <Input
          id="name"
          {...register("name")}
          disabled={loading}
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <Input
          id="username"
          {...register("username")}
          disabled={loading}
          className="mt-1"
        />
        {errors.username && (
          <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <Textarea
          id="bio"
          {...register("bio")}
          disabled={loading}
          className="mt-1"
        />
        {errors.bio && (
          <p className="mt-2 text-sm text-red-600">{errors.bio.message}</p>
        )}
      </div>

      {/* <ProfileImageUpload
        imageUrl={user.image}
        onImageChange={handleImageChange}
        disabled={loading}
      /> */}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}