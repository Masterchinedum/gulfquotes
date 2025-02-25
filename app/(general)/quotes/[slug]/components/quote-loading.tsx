// app/(general)/quotes/[slug]/components/quote-loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingQuote() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
      <div className="w-full aspect-square bg-muted/20 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-[1080px] w-[1080px] rounded-lg" />
        </div>
      </div>
      <div className="mt-8 space-y-4 w-full">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <div className="flex justify-center gap-4 mt-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}