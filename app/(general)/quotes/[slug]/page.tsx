// app/(general)/quotes/[slug]/page.tsx

import React from 'react'
import { Metadata } from "next";
import { Shell } from "@/components/shells/shell";
import { getQuoteBySlug } from "@/actions/quote";
import { notFound } from "next/navigation";
import { QuoteText } from "./components/QuoteText";
import { QuoteImage } from "./components/QuoteImage";

// Update interface to match Next.js requirements
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export async function generateMetadata({ params: paramsPromise }: PageProps): Promise<Metadata> {
  // Resolve params promise first
  const params = await paramsPromise;
  const quote = await getQuoteBySlug(params.slug);
  
  if (!quote) {
    return {
      title: "Quote Not Found",
      description: "The requested quote could not be found."
    };
  }

  return {
    title: `${quote.content.substring(0, 60)}... - ${quote.authorProfile.name}`,
    description: quote.content,
    openGraph: {
      title: `Quote by ${quote.authorProfile.name}`,
      description: quote.content,
      type: "article",
      authors: [quote.authorProfile.name]
    }
  };
}

export default async function QuotePage({ params: paramsPromise }: PageProps) {
  // Resolve params promise first
  const params = await paramsPromise;
  const quote = await getQuoteBySlug(params.slug);

  if (!quote) {
    notFound();
  }

  return (
    <Shell>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          {/* Quote header */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Quote</h1>
                <p className="text-muted-foreground">
                  By {quote.authorProfile.name}
                </p>
              </div>
            </div>
          </div>

          {/* Quote content area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <QuoteImage
              content={quote.content}
              author={quote.authorProfile.name}
              backgroundImage={quote.backgroundImage}
              galleryImages={quote.gallery.map(g => g.gallery)}
            />
            <QuoteText
              content={quote.content}
              author={quote.authorProfile.name}
            />
          </div>

          {/* Metadata and actions */}
          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Category: {quote.category.name}
              </p>
            </div>
            {/* Share buttons will go here */}
          </div>
        </div>
      </div>
    </Shell>
  );
}