import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shell } from "@/components/shells/shell";
import { ProfileHeader } from "./profile-header";
import { ProfileContent } from "@/components/users/profile-content";
import { ErrorBoundary } from "@/components/users/error-boundary";
import { LoadingSkeleton, LoadingIndicator } from "@/components/users/loading";
import type { Metadata } from "next";
import type { UserResponse } from "@/types/api/users";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const headersList = await headers();
    const resolvedParams = await params;
    const origin = process.env.NEXTAUTH_URL || "";
    
    // Include auth cookies in the metadata request
    const res = await fetch(`${origin}/api/users/${resolvedParams.slug}`, {
      headers: {
        cookie: headersList.get("cookie") || "",
      },
      cache: "no-store",
    });

    // Check if response is ok before trying to parse JSON
    if (!res.ok) {
      throw new Error(`Failed to fetch user data: ${res.status}`);
    }

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

function isErrorWithMessage(error: unknown): error is { code?: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

export default async function UserProfilePage({ params }: PageProps) {
  // Check for an authenticated session
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    const headersList = await headers();
    const resolvedParams = await params;
    const origin = process.env.NEXTAUTH_URL || "";
    const res = await fetch(`${origin}/api/users/${resolvedParams.slug}`, {
      headers: {
        cookie: headersList.get("cookie") || "",
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
            <Suspense fallback={<LoadingSkeleton />}>
              <ProfileHeader user={result.data} />
            </Suspense>
            
            <Suspense fallback={<LoadingIndicator />}>
              <ProfileContent user={result.data} />
            </Suspense>
          </div>
        </div>
      </Shell>
    );

  } catch (error) {
    console.error("[USER_PROFILE_PAGE]", error);
    return (
      <ErrorBoundary
        error={isErrorWithMessage(error) ? error : { message: "An unknown error occurred" }}
        reset={() => window.location.reload()}
      />
    );
  }
}