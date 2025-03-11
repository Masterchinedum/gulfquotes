"use client";

import { MONTH_NAMES_CAPITALIZED } from "@/lib/date-utils";
// Remove the direct import of Author type
// import { Author } from "@/types/author";

// Define a more flexible type that matches what we receive from the API
interface BirthdayAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  born?: string | null;
  died?: string | null;
  image?: string | null;
  // These fields are optional since they may not be present in API response
  quoteCount?: number;
  followers?: number;
}

interface BirthdayStructuredDataProps {
  day: number;
  month: number;
  authors: Array<BirthdayAuthor>; // Use the more flexible type
  totalAuthors: number;
}

export function BirthdayStructuredData({ day, month, authors, totalAuthors }: BirthdayStructuredDataProps) {
  const formattedDate = `${MONTH_NAMES_CAPITALIZED[month - 1]} ${day}`;
  const currentYear = new Date().getFullYear();
  
  // Create the structured data object
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": authors.map((author, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Person",
          "name": author.name,
          "description": author.bio || undefined,
          "birthDate": author.born || undefined,
          "deathDate": author.died || undefined,
          "url": `https://gulfquotes.com/authors/${author.slug}`,
          "image": author.image || undefined
        }
      })),
      "numberOfItems": totalAuthors
    },
    "name": `Authors Born on ${formattedDate}`,
    "description": `List of authors, writers, and notable figures who were born on ${formattedDate}.`,
    "datePublished": `${currentYear}-01-01T00:00:00Z`,
    "dateModified": new Date().toISOString(),
    "isPartOf": {
      "@type": "WebSite",
      "name": "gulfquotes",
      "url": "https://gulfquotes.com"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}