// app/(general)/quotes/[slug]/components/quote-error.tsx
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorQuoteProps {
  error: string;
}

export function ErrorQuote({ error }: ErrorQuoteProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto py-16">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Unable to load quote</h2>
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  );
}