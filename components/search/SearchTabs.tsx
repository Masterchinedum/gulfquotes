"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Users, User, LayoutGrid } from "lucide-react";

interface SearchTabsProps {
  totalResults?: {
    all: number;
    quotes: number;
    authors: number;
    users: number;
  };
  className?: string;
}

export function SearchTabs({ totalResults, className }: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentType = searchParams.get("type") || "all";
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    
    // Reset to page 1 when changing tab
    params.set("page", "1");
    
    router.push(`/search?${params.toString()}`);
  };
  
  return (
    <Tabs value={currentType} onValueChange={handleTabChange} className={className}>
      <TabsList className="w-full grid grid-cols-4 h-12">
        <TabsTrigger value="all" className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">All</span>
          {totalResults?.all !== undefined && (
            <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5">
              {totalResults.all}
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="quotes" className="flex items-center gap-2">
          <Book className="h-4 w-4" />
          <span className="hidden sm:inline">Quotes</span>
          {totalResults?.quotes !== undefined && (
            <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5">
              {totalResults.quotes}
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="authors" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Authors</span>
          {totalResults?.authors !== undefined && (
            <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5">
              {totalResults.authors}
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="users" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Users</span>
          {totalResults?.users !== undefined && (
            <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5">
              {totalResults.users}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}