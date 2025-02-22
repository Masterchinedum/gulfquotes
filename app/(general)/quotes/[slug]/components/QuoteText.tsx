// app/(general)/quotes/[slug]/components/QuoteText.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteTextProps {
  content: string;
  author: string;
}

export function QuoteText({ content, author }: QuoteTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${content}" - ${author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Text Version</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn(
            "transition-colors",
            copied && "text-green-500"
          )}
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      <blockquote className="text-lg space-y-2">
        <p className="italic">&quot;{content}&quot;</p>
        <footer className="text-sm text-muted-foreground">
          - {author}
        </footer>
      </blockquote>
    </Card>
  );
}