import db from "@/lib/prisma";
import type { ListQuotesResult } from "../quote/types";
import type { ListQuotesParams } from "@/types/api/quotes";
import { quoteFilterUtils } from "./utils/quote-filter.utils";
import { quoteSortUtils } from "./utils/quote-sort.utils";
import type { 
  Quote, 
  AuthorProfile, 
  Category, 
  Tag,
  QuoteToGallery,
  Gallery,
  AuthorImage
} from "@prisma/client";

type QuoteWithRelations = Quote & {
  authorProfile: AuthorProfile & {
    images: AuthorImage[];
  };
  category: Category;
  tags: Tag[];
  gallery: (QuoteToGallery & {
    gallery: Gallery;
  })[];
};

class PublicQuoteService {
  async getBySlug(slug: string): Promise<QuoteWithRelations | null> {
    return await db.quote.findUnique({
      where: { slug },
      include: {
        category: true,
        authorProfile: {
          include: {
            images: true
          }
        }
      }
    });
  }

  async list(params: ListQuotesParams): Promise<ListQuotesResult> {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const skip = (page - 1) * limit;

    // Use filter utils to build where conditions
    const whereConditions = quoteFilterUtils.buildWhereConditions({
      search: params.search,
      categoryId: params.categoryId,
      authorProfileId: params.authorProfileId
    });

    // Use sort utils for ordering
    const orderBy = quoteSortUtils.getPrismaSortOptions(params.sortBy || 'recent');

    const [items, total] = await Promise.all([
      db.quote.findMany({
        where: whereConditions,
        include: {
          authorProfile: true,
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.quote.count({ where: whereConditions })
    ]);

    return {
      items,
      total,
      hasMore: total > skip + items.length,
      page,
      limit
    };
  }
}

export const publicQuoteService = new PublicQuoteService();