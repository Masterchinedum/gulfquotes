// app/api/quotes/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { createQuoteSchema } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import { CreateQuoteResponse } from "@/types/api/quotes";
import { formatZodError } from "@/lib/api-error";

export async function POST(req: Request): Promise<NextResponse<CreateQuoteResponse>> {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createQuoteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    const { content, categoryId } = validatedData.data;
    const slug = slugify(content.substring(0, 50));

    const quote = await db.quote.create({
      data: {
        content,
        slug,
        categoryId,
        authorId: session.user.id // Now we're sure this is a string
      }
    });

    return NextResponse.json({ data: quote });

  } catch (error) {
    console.error("[QUOTES_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}