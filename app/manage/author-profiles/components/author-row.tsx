// File: app/manage/author-profiles/components/author-row.tsx
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { FormattedAuthorProfile } from "@/lib/utils/author-profile";
import Link from "next/link";
import { DeleteDialog } from "./delete-dialog";

interface AuthorRowProps {
  author: FormattedAuthorProfile;
  onDelete?: () => void;
}

export function AuthorRow({ author, onDelete }: AuthorRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{author.name}</div>
        <div className="text-sm text-muted-foreground">{author.slug}</div>
      </TableCell>
      <TableCell>{author.lifespan}</TableCell>
      <TableCell>{author.quoteCount || 0} quotes</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Link href={`/manage/author-profiles/${author.slug}`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <DeleteDialog
            authorId={author.id}
            authorName={author.name}
            onSuccess={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}