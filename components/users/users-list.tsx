"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  userProfile?: {
    username: string;
    bio?: string;
    slug: string;
  };
}

interface UsersListData {
  items: User[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

interface UsersListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
}

export function UsersList({
  initialPage = 1,
  initialLimit = 10,
  initialSearch = "",
}: UsersListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState<UsersListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  // Reconfigured fetch request following the authorProfiles pattern.
  const fetchUsers = async (pageParam: number, limitParam: number, search?: string) => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(limitParam));
      if (search) {
        params.set("search", search);
      }
      const response = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to fetch users");
      }
      const result = await response.json();
      setUsers(result.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, initialLimit, searchQuery);
  }, [page, initialLimit, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Update URL parameters for consistency (as in authorProfiles)
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    params.set("page", "1");
    params.set("limit", String(initialLimit));
    router.push(`${pathname}?${params.toString()}`);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <div className="relative">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: initialLimit }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : users && users.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.items.map((user) => (
              <Link key={user.id} href={`/users/${user.userProfile?.slug || user.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.image || ""} alt={user.name || "Unknown"} />
                        <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.name || "Anonymous"}</h3>
                        {user.userProfile?.username && (
                          <p className="text-sm text-muted-foreground">@{user.userProfile.username}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {users.hasMore && (
            <button
              onClick={() => setPage(page + 1)}
              className="w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Load More
            </button>
          )}
        </>
      ) : (
        <div className="text-center text-sm text-muted-foreground">No users found</div>
      )}
    </div>
  );
}