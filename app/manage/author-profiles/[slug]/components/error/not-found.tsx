// File: app/manage/author-profiles/[slug]/components/error/not-found.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Author Profile Not Found</h2>
      <p className="text-sm text-muted-foreground text-center max-w-[400px]">
        The author profile you&apos;re looking for doesn&lsquo;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/manage/author-profiles">
          Back to Author Profiles
        </Link>
      </Button>
    </div>
  );
}