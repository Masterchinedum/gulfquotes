// File: app/manage/author-profiles/[slug]/components/form/form-header.tsx
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface FormHeaderProps {
  title: string;
  slug: string;
}

export function FormHeader({ title, slug }: FormHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Editing author profile: {slug}
        </p>
      </div>
      <Button variant="ghost" asChild>
        <Link href="/manage/author-profiles">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to authors
        </Link>
      </Button>
    </div>
  );
}