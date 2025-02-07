// app/api/quotes/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createQuoteSchema } from "@/schemas/quote";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
      return new NextResponse("Permission denied", { status: 403 });
    }

    const body = await req.json();
    const validatedData = createQuoteSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const { content, categoryId } = validatedData.data;
    const slug = slugify(content.substring(0, 50)); // Create slug from first 50 chars

    const quote = await db.quote.create({
      data: {
        content,
        slug,
        categoryId,
        authorId: session.user.id
      }
    });

    return NextResponse.json(quote);

  } catch (error) {
    console.error("[QUOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}