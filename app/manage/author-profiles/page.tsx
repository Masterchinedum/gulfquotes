// File: app/manage/author-profiles/page.tsx
import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthorProfileTable } from "@/components/author-profiles/author-profile-table";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { formatAuthorProfile } from "@/lib/utils/author-profile";
import Link from "next/link";

interface AuthorListingProps {
  searchParams: { search?: string; page?: string };
}

async function AuthorListing({ searchParams }: AuthorListingProps) {
  const search = searchParams.search;
  const page = Number(searchParams.page) || 1;
  
  const result = await authorProfileService.list({
    search,
    page,
    limit: 10
  });

  const formattedAuthors = result.items.map(author => formatAuthorProfile(author));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search authors..."
            className="w-[300px]"
            name="search"
            defaultValue={search}
          />
          <Button type="submit">Search</Button>
        </div>
        <Link href="/manage/author-profiles/create">
          <Button>Add New Author</Button>
        </Link>
      </div>

      <AuthorProfileTable authors={formattedAuthors} />

      {/* Pagination UI here */}
      <div className="flex justify-center gap-2">
        {result.page > 1 && (
          <Link href={`?page=${result.page - 1}&search=${search || ''}`}>
            <Button variant="outline">Previous</Button>
          </Link>
        )}
        {result.hasMore && (
          <Link href={`?page=${result.page + 1}&search=${search || ''}`}>
            <Button variant="outline">Next</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AuthorProfilesPage({ searchParams }: AuthorListingProps) {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Author Profiles</h1>
        <p className="text-muted-foreground">Manage author profiles and their details</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AuthorListing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}