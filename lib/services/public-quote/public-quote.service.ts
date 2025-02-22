import db from "@/lib/prisma";
import type { ListQuotesParams, ListQuotesResult } from "../quote/types";
import { quoteFilterUtils } from "./utils/quote-filter.utils";
import { quoteSortUtils } from "./utils/quote-sort.utils";

class PublicQuoteService {
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