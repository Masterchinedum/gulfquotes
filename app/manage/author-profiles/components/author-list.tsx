// File: app/manage/author-profiles/components/author-list.tsx
"use client"

import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableCell,
  TableRow 
} from "@/components/ui/table";
import { FormattedAuthorProfile } from "@/lib/utils/author-profile";
import { ListHeader } from "./list-header";
import { AuthorRow } from "./author-row";
import { useRouter } from "next/navigation";

interface AuthorListProps {
  authors: FormattedAuthorProfile[];
}

export function AuthorList({ authors }: AuthorListProps) {
  const router = useRouter();

  return (
    // Add vertical spacing between elements
    <div className="space-y-6">
      <ListHeader />
      
      {/* Add card-like styling to table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Author</TableHead>
              <TableHead>Lifespan</TableHead>
              <TableHead>Quotes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <AuthorRow
                key={author.id}
                author={author}
                onDelete={() => {
                  router.refresh();
                }}
              />
            ))}
            {authors.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground"
                >
                  No authors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
