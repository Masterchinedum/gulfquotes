// File: components/author-profiles/author-profile-table.tsx
import { FormattedAuthorProfile } from "@/lib/utils/author-profile";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface AuthorProfileTableProps {
  authors: FormattedAuthorProfile[];
  onDelete?: (id: string) => void;
}

export function AuthorProfileTable({ authors, onDelete }: AuthorProfileTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Lifespan</TableHead>
          <TableHead>Quotes</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {authors.map((author) => (
          <TableRow key={author.id}>
            <TableCell className="font-medium">{author.name}</TableCell>
            <TableCell>{author.lifespan}</TableCell>
            <TableCell>{author.quoteCount || 0}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/manage/author-profiles/${author.slug}`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onDelete(author.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}