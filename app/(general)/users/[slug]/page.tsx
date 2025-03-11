import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ProfileHeader } from "./profile-header";
import { ProfileContent } from "@/components/users/profile-content";
import { ErrorBoundary } from "@/components/users/error-boundary";
import { LoadingSkeleton, LoadingIndicator } from "@/components/users/loading";
import type { Metadata } from "next";
import type { UserResponse } from "@/types/api/users";
import { Shell } from "@/components/shells/shell";

// Update interface to match Next.js 15 requirements - params as Promise
interface UserProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

// Update type signature to match Next.js expectations
export async function generateMetadata({ 
  params: paramsPromise 
}: UserProfilePageProps): Promise<Metadata> {
  try {
    // Resolve params promise first
    const params = await paramsPromise;
    
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    
    const res = await fetch(`${origin}/api/users/${params.slug}`, {
      headers: {
        cookie: headersList.get("cookie") || "",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch user data: ${res.status}`);
    }

    const result: UserResponse = await res.json();

    if (result.data) {
      const title = result.data.userProfile?.username || result.data.name || "User Profile";
      return {
        title: `${title} - gulfquotes`,
        description: result.data.userProfile?.bio || `View ${title}'s profile on gulfquotes`,
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "User Profile - gulfquotes",
    description: "View user profile on gulfquotes",
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

// Update the function signature to match the quote page pattern
export default async function UserProfilePage({
  params: paramsPromise,
}: UserProfilePageProps) {
  try {
    // Resolve params promise first
    const params = await paramsPromise;
    
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    const res = await fetch(`${origin}/api/users/${params.slug}`, {
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
          <div className="mx-auto w-full max-w-6xl">
            <div className="space-y-8">
              <Suspense fallback={<LoadingSkeleton />}>
                <ProfileHeader user={result.data} />
              </Suspense>
              
              <Suspense fallback={<LoadingIndicator />}>
                <ProfileContent user={result.data} />
              </Suspense>
            </div>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[USER_PROFILE_PAGE]", error);
    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-6xl">
            <ErrorBoundary
              error={isErrorWithMessage(error) ? error : { message: "An unknown error occurred" }}
              reset={() => window.location.reload()}
            />
          </div>
        </div>
      </Shell>
    );
  }
}