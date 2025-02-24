import React from 'react';
import { Metadata } from "next";
import { Shell } from "@/components/shells/shell";
import { notFound } from "next/navigation";
import Image from "next/image";
import { publicQuoteService } from "@/lib/services/public-quote/public-quote.service";

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

  // Get the first author image if available
  const authorImage = quote.authorProfile.images?.[0]?.url;

  return (
    <Shell>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Image Quote Version */}
          <div className="rounded-lg overflow-hidden shadow-lg mb-8">
            <div className="relative aspect-square">
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
              <div>
                <h2 className="font-semibold">{quote.authorProfile.name}</h2>
                <p className="text-sm text-muted-foreground">{quote.category.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}