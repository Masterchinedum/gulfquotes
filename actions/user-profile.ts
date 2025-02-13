// lib/actions/user-profile.ts
import { headers } from "next/headers";
import { UserResponse } from "@/types/api/users";

export async function fetchUserProfile(slug: string): Promise<UserResponse> {
  try {
    const origin = process.env.NEXTAUTH_URL || "";
    const res = await fetch(`${origin}/api/users/${slug}`, {
      headers: {
        cookie: headers().get("cookie") || "",
      },
      cache: "no-store",
    });

    const result: UserResponse = await res.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result;
  } catch (error) {
    console.error("[FETCH_USER_PROFILE]", error);
    throw error;
  }
}