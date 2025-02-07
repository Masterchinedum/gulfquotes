import { Quote, User } from "@prisma/client";
import { AppError } from "@/lib/api-error";
import db from "@/lib/prisma";

export async function validateQuoteOwnership(quoteId: string, userId: string): Promise<boolean> {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    select: { authorId: true },
  });

  return quote?.authorId === userId;
}

export async function canManageQuote(quote: Quote, user: User): Promise<boolean> {
  // Admins can manage all quotes
  if (user.role === "ADMIN") return true;
  
  // Authors can only manage their own quotes
  if (user.role === "AUTHOR") {
    return quote.authorId === user.id;
  }

  return false;
}

export class QuoteAccessError extends AppError {
  constructor(message: string = "You don't have permission to manage this quote") {
    super(message, "QUOTE_ACCESS_DENIED", 403);
  }
}