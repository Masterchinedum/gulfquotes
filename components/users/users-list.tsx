"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UsersResponse } from "@/types/api/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UsersListProps {
  initialLimit: number;
  pageSize: number;
  initialSearch?: string;
}

export function UsersList({
  initialLimit,
  pageSize,
  initialSearch
}: UsersListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<UsersResponse["data"]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchUsers = async (page: number, limit: number, search?: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search })
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error.message);
      }

      setUsers(data.data);
      router.push(`${pathname}?${params}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Browse and discover users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            onChange={(e) => fetchUsers(1, initialLimit, e.target.value)}
            defaultValue={initialSearch}
          />
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: pageSize }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : users?.items && users.items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.items.map((user) => (
            <Link key={user.id} href={`/users/${user.userProfile?.slug || user.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-medium">{user.name}</h3>
                      {user.userProfile?.username && (
                        <p className="text-sm text-muted-foreground">
                          @{user.userProfile.username}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      )}
    </div>
  );
}