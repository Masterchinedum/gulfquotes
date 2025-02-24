import React, { Suspense } from 'react';
import { Metadata } from "next";
import { Shell } from "@/components/shells/shell";
import { notFound } from "next/navigation";
import { publicQuoteService } from "@/lib/services/public-quote/public-quote.service";
import { QuoteDisplay } from "./components/quote-display";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import db from "@/lib/prisma"; // Add this import

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Quote Content Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        
        {/* Author Info Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Image Preview Skeleton */}
        <Skeleton className="h-[400px] w-full" />

        {/* Actions Skeleton */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
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
      images: quote.backgroundImage ? [{ url: quote.backgroundImage }] : [],
    }
  };
}

export default async function QuotePage({ params: paramsPromise }: PageProps) {
  return (
    <Shell>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSkeleton />}>
              <QuoteContent params={paramsPromise} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </Shell>
  );
}

async function QuoteContent({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  try {
    const params = await paramsPromise;
    const quote = await publicQuoteService.getBySlug(params.slug);

    if (!quote) {
      notFound();
    }

    // Make sure authorProfile includes images
    const fullQuote = await db.quote.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        authorProfile: {
          include: {
            images: true
          }
        }
      }
    });

    if (!fullQuote) {
      notFound();
    }

    return <QuoteDisplay quote={fullQuote} />;
  } catch (error) {
    console.error("[QUOTE_PAGE]", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to load quote"
    );
  }
}