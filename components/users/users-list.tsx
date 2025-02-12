"use client";

import { useUsers } from "@/hooks/use-users";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchInput } from "@/components/users/search-input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";

interface UsersListProps {
  pageSize?: number;
  initialLimit?: number;
}

export function UsersList({ pageSize = 10 }: UsersListProps) {
  const { 
    users, 
    isLoading, // We'll use this now
    error, 
    hasMore, 
    loadMore, 
    searchUsers 
  } = useUsers({ pageSize });

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
          onSearch={searchUsers}
          className="w-full md:w-[300px]"
          disabled={isLoading} // Add disabled state
        />
      </div>

      {isLoading && !users?.items ? ( // Show loading state only on initial load
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: pageSize }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
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
              {users?.items.length ? 'No more users to load' : 'No users found'}
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
