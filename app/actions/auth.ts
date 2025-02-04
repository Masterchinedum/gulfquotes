// app/actions/auth.ts
"use server";

import { signOut } from "@/lib/auth";

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}