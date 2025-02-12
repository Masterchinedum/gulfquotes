"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import InfiniteScroll from "react-infinite-scroll-component";
import { UsersResponse } from "@/types/api/users";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchInput } from "@/components/users/search-input";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface UsersListProps {
  initialLimit: number;
  initialSearch?: string;
}

export function UsersList({ initialLimit, initialSearch }: UsersListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<UsersResponse["data"]>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchUsers = useCallback(async (pageNumber: number, limit: number, search?: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: String(limit),
        ...(search && { search }),
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error.message);
      }

      setUsers(prevUsers => {
        if (pageNumber === 1) {
          return data.data;
        }
        return {
          ...data.data,
          items: [...(prevUsers?.items || []), ...data.data.items]
        };
      });
      
      setHasMore(data.data.hasMore);
      router.push(`${pathname}?${params}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, initialLimit, initialSearch);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchUsers(1, initialLimit, initialSearch);
  }, [initialSearch, initialLimit, fetchUsers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Browse and discover users
          </p>
        </div>
        <SearchInput 
          onSearch={(term) => {
            setPage(1);
            fetchUsers(1, initialLimit, term);
          }}
          defaultValue={initialSearch}
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : (
        <InfiniteScroll
          dataLength={users?.items?.length || 0}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
          endMessage={
            <p className="text-center text-sm text-muted-foreground py-4">
              No more users to load
            </p>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users?.items.map((user) => (
              <Link 
                key={user.id} 
                href={`/users/${user.userProfile?.slug || user.id}`}
              >
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
        </InfiniteScroll>
      )}
    </div>
  );
}
