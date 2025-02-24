import React from 'react';
import { Metadata } from "next";
import { Shell } from "@/components/shells/shell";
import { notFound } from "next/navigation";
import { publicQuoteService } from "@/lib/services/public-quote/public-quote.service";
import { QuoteDisplay } from "./components/quote-display";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const quote = await publicQuoteService.getBySlug(resolvedParams.slug);

  if (!quote) {
    return {
      title: "Quote Not Found",
      description: "The requested quote could not be found."
    };
  }

  return {
    title: `${quote.content.substring(0, 50)}... - ${quote.authorProfile.name}`,
    description: quote.content,
    openGraph: {
      title: `Quote by ${quote.authorProfile.name}`,
      description: quote.content,
    }
  };
}

export default async function QuotePage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise;
  const quote = await publicQuoteService.getBySlug(params.slug);

  if (!quote) {
    notFound();
  }

  return (
    <Shell>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <QuoteDisplay quote={quote} />
        </div>
      </div>
    </Shell>
  );
}