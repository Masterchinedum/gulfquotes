// File: app/manage/author-profiles/[slug]/components/error/error.tsx
"use client"

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  message = "Something went wrong while loading the author profile.",
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <h2 className="text-lg font-semibold">Error</h2>
      <p className="text-sm text-muted-foreground text-center max-w-[400px]">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}