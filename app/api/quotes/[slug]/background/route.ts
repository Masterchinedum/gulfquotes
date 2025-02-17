import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { quoteService } from "@/lib/services/quote.service";
import { AppError } from "@/lib/api-error";
import type { QuoteResponse } from "@/types/api/quotes";

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const quote = await quoteService.getBySlug(params.slug);
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    const { imageUrl } = await req.json();
    const result = await quoteService.setBackgroundImage(quote.id, imageUrl);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}