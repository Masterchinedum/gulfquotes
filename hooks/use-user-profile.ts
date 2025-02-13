// hooks/use-user-profile.ts
import useSWR from "swr";
import { fetchUserProfile } from "@/lib/actions/user-profile";
import type { UserResponse } from "@/types/api/users";

export function useUserProfile(slug: string) {
  const { data, error, isLoading } = useSWR<UserResponse>(
    slug ? `/api/users/${slug}` : null,
    () => fetchUserProfile(slug)
  );

  return {
    userProfile: data?.data,
    isLoading,
    isError: !!error,
    error,
  };
}