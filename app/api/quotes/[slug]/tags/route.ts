// app/api/quotes/[slug]/tags/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { QuoteResponse } from "@/types/api/quotes";
import type { TagsResponse } from "@/types/api/tags";
import { z } from "zod";

// Validation schema for adding/removing tags
const tagOperationSchema = z.object({
  tagIds: z.array(z.string()).min(1, "At least one tag must be provided")
});

// GET - Fetch all tags for a specific quote
export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
): Promise<NextResponse<TagsResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const quote = await db.quote.findUnique({
      where: { slug: context.params.slug },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { quotes: true }
            }
          }
        }
      }
    });

    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        items: quote.tags.map(tag => ({
          ...tag,
          quoteCount: tag._count.quotes
        })),
        total: quote.tags.length,
        page: 1,
        limit: quote.tags.length,
        hasMore: false
      }
    });

  } catch (error) {
    console.error("[QUOTE_TAGS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST - Add tags to a quote
export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const quote = await db.quote.findUnique({
      where: { slug: context.params.slug },
      include: { author: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && quote.authorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = tagOperationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid input data",
            details: validatedData.error.flatten().fieldErrors
          } 
        },
        { status: 400 }
      );
    }

    const updatedQuote = await db.quote.update({
      where: { slug: context.params.slug },
      data: {
        tags: {
          connect: validatedData.data.tagIds.map(id => ({ id }))
        }
      },
      include: {
        tags: true,
        category: true,
        authorProfile: true
      }
    });

    return NextResponse.json({ data: updatedQuote });

  } catch (error) {
    console.error("[QUOTE_TAGS_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE - Remove tags from a quote
export async function DELETE(
  req: NextRequest,
  context: { params: { slug: string } }
): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const quote = await db.quote.findUnique({
      where: { slug: context.params.slug },
      include: { author: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && quote.authorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = tagOperationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid input data",
            details: validatedData.error.flatten().fieldErrors
          } 
        },
        { status: 400 }
      );
    }

    const updatedQuote = await db.quote.update({
      where: { slug: context.params.slug },
      data: {
        tags: {
          disconnect: validatedData.data.tagIds.map(id => ({ id }))
        }
      },
      include: {
        tags: true,
        category: true,
        authorProfile: true
      }
    });

    return NextResponse.json({ data: updatedQuote });

  } catch (error) {
    console.error("[QUOTE_TAGS_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}