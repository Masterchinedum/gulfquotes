// app/api/quotes/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createQuoteSchema } from "@/schemas/quote";
import { CreateQuoteResponse } from "@/types/api/quotes";
import { formatZodError } from "@/lib/api-error";
import { quoteService } from "@/lib/services/quote.service";

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

    const quote = await quoteService.create({
      ...validatedData.data,
      authorId: session.user.id
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