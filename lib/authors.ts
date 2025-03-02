import { type Author } from "@/types/author"
import { Prisma } from "@prisma/client"
import db from "@/lib/prisma"
import { PaginationParams } from "@/lib/pagination"
import { authorFollowService } from "@/lib/services/follow" // Import follow service

interface FetchAuthorsParams extends PaginationParams {
  search?: string
  letter?: string
  userId?: string // Add userId parameter for follow status
}

type AuthorWithCounts = {
  id: string
  name: string
  slug: string
  bio: string | null
  born: string | null
  died: string | null
  followers: number // Add followers field
  images: {
    url: string
  }[]
  _count: {
    quotes: number
  }
}

// Helper function to build where conditions
function buildWhereConditions(search?: string, letter?: string): Prisma.AuthorProfileWhereInput {
  const conditions: Prisma.AuthorProfileWhereInput = {}

  if (search) {
    conditions.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (letter) {
    if (letter === '#') {
      conditions.name = {
        not: {
          startsWith: /^[A-Za-z]/.source,
        }
      }
    } else {
      conditions.name = {
        startsWith: letter,
        mode: 'insensitive'
      }
    }
  }

  return conditions
}

export async function fetchAuthors({
  page = 1,
  limit = 10,
  search,
  letter,
  userId // Add userId parameter
}: FetchAuthorsParams) {
  const skip = (page - 1) * limit
  const whereConditions = buildWhereConditions(search, letter)

  const [items, total] = await Promise.all([
    fetchAuthorItems(whereConditions, skip, limit),
    countAuthors(whereConditions)
  ])

  // Check if we need to fetch follow status
  let authorItems = formatAuthors(items);
  
  if (userId) {
    // Get all author IDs to check follow status
    const authorIds = items.map(item => item.id);
    
    // Fetch follow status for all authors in one batch operation
    const followStatus = await authorFollowService.getUserFollows(userId, authorIds);
    
    // Add follow status to the formatted authors
    authorItems = authorItems.map(author => ({
      ...author,
      isFollowed: followStatus[author.id] || false
    }));
  }

  return {
    data: {
      items: authorItems,
      total,
      hasMore: total > skip + items.length,
      page,
      limit
    }
  }
}

// Helper function to fetch author items
async function fetchAuthorItems(
  whereConditions: Prisma.AuthorProfileWhereInput,
  skip: number,
  limit: number
) {
  return await db.authorProfile.findMany({
    where: whereConditions,
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      born: true,
      died: true,
      followers: true, // Add this to select the followers field
      images: {
        select: {
          url: true
        },
        take: 1
      },
      _count: {
        select: {
          quotes: true
        }
      }
    },
    skip,
    take: limit,
    orderBy: { name: 'asc' }
  })
}

// Helper function to count authors
async function countAuthors(whereConditions: Prisma.AuthorProfileWhereInput) {
  return await db.authorProfile.count({ where: whereConditions })
}

// Helper function to format authors
function formatAuthors(items: AuthorWithCounts[]): Author[] {
  return items.map(author => ({
    id: author.id,
    name: author.name,
    slug: author.slug,
    bio: author.bio,
    image: author.images[0]?.url || null,
    quoteCount: author._count.quotes,
    born: author.born,
    died: author.died,
    followers: author.followers || 0 // Include followers count, default to 0
  }))
}