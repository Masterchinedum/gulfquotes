// import { Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import type { 
  SearchParams, 
  SearchResult, 
//   SearchType 
} from "@/types/search";

class SearchServiceImpl {
  // Helper method to calculate relevance score
  private calculateScore(matchType: string, text: string, query: string, type: string): number {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    // Base scores by type priority
    const typeScores = {
      quotes: 3,
      authors: 2,
      users: 1
    };

    let score = typeScores[type as keyof typeof typeScores] || 0;

    // Add match quality score
    if (normalizedText === normalizedQuery) {
      score += 2; // Exact match
    } else if (normalizedText.includes(normalizedQuery)) {
      score += 1; // Partial match
    }

    // Boost score for content matches in quotes
    if (type === "quotes" && matchType === "content") {
      score *= 1.5;
    }

    return score;
  }

  async search({ q, type = "all", page = 1, limit = 10 }: SearchParams) {
    const skip = (page - 1) * limit;
    const searchQuery = q.trim();

    try {
      // Run queries in parallel based on type
      const [quotes, authors, users] = await Promise.all([
        type === "all" || type === "quotes"
          ? db.quote.findMany({
              where: {
                OR: [
                  { content: { contains: searchQuery, mode: "insensitive" } },
                  { authorProfile: { name: { contains: searchQuery, mode: "insensitive" } } },
                  { category: { name: { contains: searchQuery, mode: "insensitive" } } }
                ]
              },
              include: {
                authorProfile: true,
                category: true,
              },
              take: type === "all" ? Math.floor(limit * 1.5) : limit, // Get more quotes for mixed results
              skip,
            })
          : [],

        type === "all" || type === "authors"
          ? db.authorProfile.findMany({
              where: {
                OR: [
                  { name: { contains: searchQuery, mode: "insensitive" } },
                  { bio: { contains: searchQuery, mode: "insensitive" } }
                ]
              },
              take: type === "all" ? Math.floor(limit * 1.2) : limit, // Get more authors for mixed results
              skip,
            })
          : [],

        type === "all" || type === "users"
          ? db.user.findMany({
              where: {
                name: { contains: searchQuery, mode: "insensitive" }
              },
              select: {
                id: true,
                name: true,
                image: true,
              },
              take: limit,
              skip,
            })
          : []
      ]);

      // Transform and score results with improved relevance
      const results: SearchResult[] = [
        ...quotes.map(quote => ({
          id: quote.id,
          type: "quotes" as const,
          matchedOn: quote.content.toLowerCase().includes(searchQuery.toLowerCase()) 
            ? "content" 
            : "metadata",
          score: this.calculateScore(
            quote.content.toLowerCase().includes(searchQuery.toLowerCase()) ? "content" : "metadata",
            quote.content,
            searchQuery,
            "quotes"
          ),
          data: {
            content: quote.content,
            slug: quote.slug,
            authorName: quote.authorProfile.name,
            category: quote.category.name
          }
        })),

        ...authors.map(author => ({
          id: author.id,
          type: "authors" as const,
          matchedOn: author.name.toLowerCase().includes(searchQuery.toLowerCase()) ? "name" : "bio",
          score: this.calculateScore("name", author.name, searchQuery, "authors"),
          data: {
            name: author.name,
            slug: author.slug,
            bio: author.bio
          }
        })),

        ...users.map(user => ({
          id: user.id,
          type: "users" as const,
          matchedOn: "name",
          score: this.calculateScore("name", user.name || "", searchQuery, "users"),
          data: {
            name: user.name || "",
            image: user.image
          }
        }))
      ];

      // Sort results by score and group by type
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const total = results.length;
      const hasMore = total > skip + limit;

      return {
        results: sortedResults,
        total,
        page,
        limit,
        hasMore
      };

    } catch (error) {
      console.error("[SearchService]", error);
      throw error;
    }
  }
}

export const searchService = new SearchServiceImpl();