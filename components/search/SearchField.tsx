"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon, Loader2 } from "lucide-react";

export function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString().trim();

    if (!query) {
      setError("Please enter a search term");
      return;
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", query);
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        type="search"
        name="q"
        placeholder="Search quotes, authors, or users..."
        defaultValue={searchParams.get("q") ?? ""}
        className="pr-10"
      />
      {isPending ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <SearchIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </form>
  );
}
