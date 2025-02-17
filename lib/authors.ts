import { type Author } from "@/types/author"
import { Prisma } from "@prisma/client"
import db from "@/lib/prisma"
import { PaginationParams } from "@/lib/pagination"

interface FetchAuthorsParams extends PaginationParams {
  search?: string
  letter?: string
}

// Type for where conditions
type WhereConditions = Prisma.AuthorProfileWhereInput

// Type for the author items from DB
type AuthorItem = {
  id: string
  name: string
  slug: string
  bio: string | null
  born: string | null
  died: string | null
  images: {
    url: string
  }[]
  _count: {
    quotes: number
  }
}

export async function fetchAuthors({
  page = 1,
  limit = 10,
  search,
  letter
}: FetchAuthorsParams) {
  // Calculate offset
  const skip = (page - 1) * limit

  // Build where conditions
  const whereConditions = buildWhereConditions(search, letter)

  // Execute queries in parallel
  const [items, total] = await Promise.all([
    fetchAuthorItems(whereConditions, skip, limit),
    countAuthors(whereConditions)
  ])

  return {
    items: formatAuthors(items),
    total,
    hasMore: total > skip + items.length,
    page,
    limit
  }
}

// Helper function to build where conditions
function buildWhereConditions(search?: string, letter?: string): WhereConditions {
  const conditions: WhereConditions = {}

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
          mode: 'insensitive'
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

// Helper function to fetch author items
async function fetchAuthorItems(
  whereConditions: WhereConditions, 
  skip: number, 
  limit: number
): Promise<AuthorItem[]> {
  return await db.authorProfile.findMany({
    where: whereConditions,
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      born: true,
      died: true,
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
async function countAuthors(whereConditions: WhereConditions): Promise<number> {
  return await db.authorProfile.count({ where: whereConditions })
}

// Helper function to format authors
function formatAuthors(items: AuthorItem[]): Author[] {
  return items.map(author => ({
    id: author.id,
    name: author.name,
    slug: author.slug,
    bio: author.bio,
    image: author.images[0]?.url || null,
    quoteCount: author._count.quotes,
    born: author.born,
    died: author.died
  }))
}