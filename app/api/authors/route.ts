import { NextResponse } from "next/server"
import db from "@/lib/prisma"
import type { AuthorsResponse } from "@/types/author"
import { Prisma } from "@prisma/client"

export async function GET(req: Request): Promise<NextResponse<AuthorsResponse>> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10))
    const search = searchParams.get("search")?.trim()
    const letter = searchParams.get("letter")?.toUpperCase()

    // Calculate offset
    const skip = (page - 1) * limit

    // Build where conditions
    const whereConditions: Prisma.AuthorProfileWhereInput = {}

    // Add search filter
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add alphabet filter
    if (letter) {
      if (letter === '#') {
        // Handle non-alphabetic starts
        whereConditions.name = {
          not: {
            startsWith: /^[A-Za-z]/.source,
            mode: 'insensitive'
          }
        }
      } else {
        whereConditions.name = {
          startsWith: letter,
          mode: 'insensitive'
        }
      }
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      db.authorProfile.findMany({
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
      }),
      db.authorProfile.count({ where: whereConditions })
    ])

    // Transform the data to match the Author interface
    const formattedItems = items.map(author => ({
      id: author.id,
      name: author.name,
      slug: author.slug,
      bio: author.bio,
      image: author.images[0]?.url || null,
      quoteCount: author._count.quotes,
      born: author.born,
      died: author.died
    }))

    return NextResponse.json({
      data: {
        items: formattedItems,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      }
    })

  } catch (error) {
    console.error("[AUTHORS_GET]", error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}