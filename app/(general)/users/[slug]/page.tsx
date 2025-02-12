import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { ProfileHeader } from "./profile-header";
import { ProfileContent } from "@/components/users/profile-content";
import { Suspense } from "react";
import type { Metadata } from "next";
import type { UserResponse } from "@/types/api/users";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const origin = process.env.NEXTAUTH_URL || "";
    const res = await fetch(`${origin}/api/users/${params.slug}`);
    const result: UserResponse = await res.json();

    if (result.data) {
      const title = result.data.userProfile?.username || result.data.name || "User Profile";
      return {
        title: `${title} - Quoticon`,
        description: result.data.userProfile?.bio || `View ${title}'s profile on Quoticon`,
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "User Profile - Quoticon",
    description: "View user profile on Quoticon",
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  // Check for an authenticated session
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    // Build an absolute URL using NEXTAUTH_URL
    const origin = process.env.NEXTAUTH_URL || "";
    const res = await fetch(`${origin}/api/users/${params.slug}`, {
      headers: {
        cookie: headers().get("cookie") || "",
      },
      cache: "no-store",
    });

    const result: UserResponse = await res.json();

    if (result.error) {
      if (result.error.code === "NOT_FOUND") {
        notFound();
      }
      throw new Error(result.error.message);
    }

    if (!result.data) {
      notFound();
    }

    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-3xl space-y-8">
            <Suspense fallback={<div>Loading profile...</div>}>
              <ProfileHeader user={result.data} />
            </Suspense>
            
            <Suspense fallback={<div>Loading content...</div>}>
              <ProfileContent user={result.data} />
            </Suspense>
          </div>
        </div>
      </Shell>
    );

  } catch (error) {
    console.error("[USER_PROFILE_PAGE]", error);
    throw error; // Let error boundary handle it
  }
}