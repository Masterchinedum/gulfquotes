import type { Quote, Prisma } from "@prisma/client";

interface FilterOptions {
  search?: string;
  categoryId?: string;
  authorProfileId?: string;
  tags?: string[];
}

export const quoteFilterUtils = {
  /**
   * Build Prisma where conditions for quote filtering
   */
  buildWhereConditions(options: FilterOptions): Prisma.QuoteWhereInput {
    const conditions: Prisma.QuoteWhereInput = {};

    if (options.search) {
      conditions.content = {
        contains: options.search,
        mode: 'insensitive'
      };
    }

    if (options.categoryId) {
      conditions.categoryId = options.categoryId;
    }

    if (options.authorProfileId) {
      conditions.authorProfileId = options.authorProfileId;
    }

    if (options.tags?.length) {
      conditions.tags = {
        some: {
          id: {
            in: options.tags
          }
        }
      };
    }

    return conditions;
  },

  /**
   * Filter quotes by text content
   */
  filterByContent(quotes: Quote[], searchText: string): Quote[] {
    const normalizedSearch = searchText.toLowerCase();
    return quotes.filter(quote => 
      quote.content.toLowerCase().includes(normalizedSearch)
    );
  }
};