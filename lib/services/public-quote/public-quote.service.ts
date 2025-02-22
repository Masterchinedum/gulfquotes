import { Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import type { ListQuotesParams, ListQuotesResult } from "../quote/types";

class PublicQuoteService {
  async list(params: ListQuotesParams): Promise<ListQuotesResult> {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const skip = (page - 1) * limit;

    const whereConditions: Prisma.QuoteWhereInput = {
      ...(params.authorProfileId && { authorProfileId: params.authorProfileId }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.search && { 
        content: {
          contains: params.search,
          mode: Prisma.QueryMode.insensitive
        }
      })
    };

    const [items, total] = await Promise.all([
      db.quote.findMany({
        where: whereConditions,
        include: {
          authorProfile: true,
          category: true,
        },
        orderBy: { createdAt: 'desc' },
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