"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthorProfile } from "@/lib/auth/author-profile";
import { AuthorProfileCard } from "@/components/author-profile/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { RoleGate } from "@/components/auth/role-gate";

export default function AuthorProfilesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: authorProfiles, isLoading } = useQuery<{ data: AuthorProfile[] }>({
    queryKey: ["author-profiles", searchQuery],
    queryFn: async () => {
      const url = new URL("/api/author-profiles", window.location.origin);
      if (searchQuery) {
        url.searchParams.set("q", searchQuery);
      }
      const response = await fetch(url);
      return response.json();
    },
  });

  return (
    <RoleGate allowedRole={["ADMIN", "AUTHOR"]}>
      <div className="container mx-auto py-10">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Author Profiles</h1>
            <Button
              onClick={() => router.push("/manage/author-profiles/create")}
              className="flex items-center gap-2"
            >
              <Icons.plus className="h-4 w-4" />
              New Author Profile
            </Button>
          </div>

          {/* Search Section */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search author profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Author Profiles Grid */}
          {isLoading ? (
            <div className="flex justify-center">
              <Icons.spinner className="h-6 w-6 animate-spin" />
            </div>
          ) : authorProfiles?.data?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authorProfiles.data.map((profile) => (
                <AuthorProfileCard
                  key={profile.id}
                  author={profile}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/manage/author-profiles/${profile.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Icons.empty className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No author profiles found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by creating a new author profile"}
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}