"use client";

import { MONTH_NAMES_CAPITALIZED } from "@/lib/date-utils";
import { AuthorProfileWithDates } from "@/lib/services/interfaces/author-profile-service.interface";

interface BirthdayStructuredDataProps {
  day: number;
  month: number;
  authors: Array<AuthorProfileWithDates>;
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
          "description": author.bio,
          "birthDate": author.bornYear ? `${author.bornYear}-${author.bornMonth?.toString().padStart(2, '0')}-${author.bornDay?.toString().padStart(2, '0')}` : undefined,
          "deathDate": author.diedYear ? `${author.diedYear}-${author.diedMonth?.toString().padStart(2, '0')}-${author.diedDay?.toString().padStart(2, '0')}` : undefined,
          "birthPlace": author.birthPlace,
          "url": `https://gulfquotes.com/authors/${author.slug}`,
          "image": author.images && author.images.length > 0 ? author.images[0].url : undefined
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