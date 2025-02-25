// app/(general)/quotes/[slug]/components/quote-not-found.tsx
import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuoteNotFound() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto py-16">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Quote Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The quote you&lsquo;re looking for doesn&lsquo;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/quotes">Browse Quotes</Link>
      </Button>
    </div>
  );
}