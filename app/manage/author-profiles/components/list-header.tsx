// File: app/manage/author-profiles/components/list-header.tsx
import { Button } from "@/components/ui/button";
import { SearchInput } from "./search-input";
import Link from "next/link";
import { Plus } from "lucide-react";

export function ListHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Author Profiles</h1>
        <p className="text-sm text-muted-foreground">
          Manage and organize your author profiles
        </p>
      </div>
      <div className="flex items-center gap-4">
        <SearchInput />
        <Button asChild>
          <Link href="/manage/author-profiles/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Author
          </Link>
        </Button>
      </div>
    </div>
  );
}