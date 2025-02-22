import { QuoteCard } from "./quote-card";

interface QuoteGridProps {
  quotes: Array<{
    id: string;
    slug: string;
    content: string;
    backgroundImage: string | null;
    author: {
      name: string;
      image?: string | null;
      slug: string;
    };
    category: {
      name: string;
      slug: string;
    };
  }>;
}

export function QuoteGrid({ quotes }: QuoteGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quotes.map((quote) => (
        <QuoteCard key={quote.id} quote={quote} />
      ))}
    </div>
  );
}