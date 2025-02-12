// hooks/use-users.ts
import { useCallback, useEffect, useState } from "react";
import { UsersResponse } from "@/types/api/users";

interface UseUsersProps {
  pageSize?: number;
}

export function useUsers({ pageSize = 10 }: UseUsersProps = {}) {
  const [users, setUsers] = useState<UsersResponse["data"]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>();

  const fetchUsers = useCallback(async (options: { 
    page: number;
    search?: string;
    limit: number;
  }) => {
    try {
      setIsLoading(true);
      setError(undefined);

      const params = new URLSearchParams({
        page: String(options.page),
        limit: String(options.limit),
        ...(options.search && { search: options.search }),
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error.message);
      }

      setUsers(prev => {
        if (options.page === 1) {
          return data.data;
        }
        return {
          ...data.data,
          items: [...(prev?.items || []), ...data.data.items]
        };
      });
      
      setHasMore(data.data.hasMore);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers({ page: nextPage, search, limit: pageSize });
    }
  }, [fetchUsers, hasMore, isLoading, page, pageSize, search]);

  const searchUsers = useCallback((term: string) => {
    setSearch(term);
    setPage(1);
    fetchUsers({ page: 1, search: term, limit: pageSize });
  }, [fetchUsers, pageSize]);

  useEffect(() => {
    fetchUsers({ page: 1, limit: pageSize });
  }, [fetchUsers, pageSize]);

  return {
    users,
    isLoading,
    error,
    hasMore,
    loadMore,
    searchUsers
  };
}