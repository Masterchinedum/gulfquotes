import type { Quote } from "@prisma/client";

type SortOption = 'recent' | 'popular' | 'length' | 'alphabetical';

export const quoteSortUtils = {
  /**
   * Get sort options for Prisma query
   */
  getPrismaSortOptions(sortBy: SortOption): Prisma.QuoteOrderByWithRelationInput {
    switch (sortBy) {
      case 'recent':
        return { createdAt: 'desc' };
      case 'popular':
        return { likes: 'desc' };
      case 'length':
        return { content: 'asc' };
      case 'alphabetical':
        return { content: 'asc' };
      default:
        return { createdAt: 'desc' };
    }
  },

  /**
   * Sort quotes array
   */
  sortQuotes(quotes: Quote[], sortBy: SortOption): Quote[] {
    const sortedQuotes = [...quotes];

    switch (sortBy) {
      case 'recent':
        return sortedQuotes.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      case 'length':
        return sortedQuotes.sort((a, b) => 
          a.content.length - b.content.length
        );
      case 'alphabetical':
        return sortedQuotes.sort((a, b) => 
          a.content.localeCompare(b.content)
        );
      default:
        return sortedQuotes;
    }
  }
};