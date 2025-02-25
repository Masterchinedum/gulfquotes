// app/(general)/quotes/[slug]/components/quote-error.tsx
"use client"

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ErrorQuoteProps {
  error: string;
  showBackButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function ErrorQuote({ 
  error,
  showBackButton,
  showRetryButton,
  onRetry
}: ErrorQuoteProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto py-16">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Unable to load quote</h2>
      <p className="text-muted-foreground mb-6">{error}</p>
      <div className="flex gap-4">
        {showBackButton && (
          <Button 
            variant="outline"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        )}
        {showRetryButton && (
          <Button 
            onClick={onRetry || (() => window.location.reload())}
          >
            Try Again
          </Button>
        )}
        {!showBackButton && !showRetryButton && (
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}