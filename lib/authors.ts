import { type Author } from "@/types/author"
import db from "@/lib/prisma"
import { PaginationParams } from "@/lib/pagination"

interface FetchAuthorsParams extends PaginationParams {
  search?: string
  letter?: string
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
function buildWhereConditions(search?: string, letter?: string) {
  const conditions: any = {}

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
async function fetchAuthorItems(whereConditions: any, skip: number, limit: number) {
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
async function countAuthors(whereConditions: any) {
  return await db.authorProfile.count({ where: whereConditions })
}

// Helper function to format authors
function formatAuthors(items: any[]): Author[] {
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