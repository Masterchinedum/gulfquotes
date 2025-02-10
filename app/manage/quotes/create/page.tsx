// app/manage/quotes/create/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { QuoteForm } from "@/components/quotes/quote-form";
// We will create the CategoryForm component for admin users in a later step.
import { CategoryForm } from "@/components/quotes/category-form";
import db from "@/lib/prisma";

export default async function NewQuotePage() {
  // Check for an authenticated session
  const session = await auth();
  if (!session?.user) {
    // Redirect to login if there's no valid session
    redirect("/login");
  }

  // Only ADMINs or AUTHORS are allowed for quote creation
  if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
    redirect("/unauthorized");
  }

  // Fetch both categories and author profiles
  const [categories, authorProfiles] = await Promise.all([
    db.category.findMany(),
    db.authorProfile.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        born: true,
        died: true,
        influences: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })
  ]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Create a New Quote</h1>
      <QuoteForm 
        categories={categories} 
        authorProfiles={authorProfiles}
      />
      
      {/* Conditionally render the admin-only category creation section */}
      {session.user.role === "ADMIN" && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Create a New Category</h2>
          <CategoryForm />
        </div>
      )}
    </div>
  );
}