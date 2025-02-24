"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Quote, AuthorProfile, Category, AuthorImage } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";

interface QuoteDisplayProps {
  quote: Quote & {
    authorProfile: AuthorProfile & {
      images: AuthorImage[];
    };
    category: Category;
  };
  className?: string;
}

export function QuoteDisplay({ quote, className }: QuoteDisplayProps) {
  // Get the first author image if available
  const authorImage = quote.authorProfile.images?.[0]?.url;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Image Quote Version */}
      <div className="rounded-lg overflow-hidden shadow-lg">
        <div className="relative aspect-square">
          {/* Background Layer */}
          <div className="absolute inset-0">
            {quote.backgroundImage ? (
              <Image
                src={quote.backgroundImage}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-black/50" />
          </div>

          {/* Content Layer */}
          <div className="relative h-full p-8 flex flex-col items-center justify-between">
            <div className="flex-1 flex items-center">
              <blockquote className="text-center text-2xl font-medium text-white">
                &quot;{quote.content}&quot;
              </blockquote>
            </div>
            <div className="w-full flex items-center justify-between text-white/90">
              <p className="text-lg font-medium">{quote.authorProfile.name}</p>
              <p className="text-sm">Quoticon</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-muted p-4 flex justify-end gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Text Quote Version */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <blockquote className="text-xl mb-4">
          &quot;{quote.content}&quot;
        </blockquote>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
            {authorImage && (
              <Image
                src={authorImage}
                alt={quote.authorProfile.name}
                width={40}
                height={40}
                className="object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{quote.authorProfile.name}</h2>
            <p className="text-sm text-muted-foreground">{quote.category.name}</p>
          </div>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share quote text</span>
          </Button>
        </div>
      </div>
    </div>
  );
}