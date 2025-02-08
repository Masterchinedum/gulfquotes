"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGate } from "@/components/auth/role-gate";
import { AuthorProfileForm } from "@/components/author-profile/form";
import { createAuthorProfile } from "@/actions/author-profile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CreateAuthorProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (formData: FormData) => {
    try {
      console.log('CreatePage onSubmit called');
      console.log('FormData entries:', Array.from(formData.entries()));
      setIsLoading(true);
      
      const result = await createAuthorProfile(formData);
      console.log('Server action result:', result);

      if (!result.success) {
        console.error('Server action error:', result.error);
        toast.error(result.error.message);
        return;
      }

      toast.success("Author profile created successfully");
      router.push("/manage/author-profiles");
      router.refresh();
    } catch (error) {
      console.error("Error creating author profile:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGate allowedRole={["ADMIN", "AUTHOR"]}>
      <div className="container mx-auto py-10">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Create Author Profile</h1>
            </div>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              Back
            </Button>
          </div>

          {/* Form */}
          <div className="mx-auto w-full max-w-3xl">
            <AuthorProfileForm
              onSubmit={(formData) => {
                const data = new FormData();
                
                // Append text fields
                Object.entries(formData).forEach(([key, value]) => {
                  if (key !== "images") {
                    data.append(key, value as string);
                  }
                });

                // Append images
                if (formData.images?.profile) {
                  data.append("profile", formData.images.profile);
                }
                if (formData.images?.gallery?.length) {
                  formData.images.gallery.forEach(url => {
                    data.append("gallery", url);
                  });
                }

                onSubmit(data);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </RoleGate>
  );
}