import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { QuoteForm } from "@/components/quotes/quote-form";
import db from "@/lib/prisma";

export default async function NewQuotePage() {
  // Check for an authenticated session
  const session = await auth();
  if (!session?.user) {
    // Redirect to login if there's no valid session
    redirect("/login");
  }

  // Only ADMINs or AUTHORS are allowed
  if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
    redirect("/unauthorized");
  }

  // Fetch necessary data for the form (e.g., categories)
  const categories = await db.category.findMany();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Create a New Quote</h1>
      <QuoteForm categories={categories} />
    </div>
  );
}