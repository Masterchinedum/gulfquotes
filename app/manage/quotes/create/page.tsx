// app/manage/quotes/create/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { QuoteForm } from "@/components/quotes/quote-form";
import { CategoryForm } from "@/components/quotes/category-form";
import db from "@/lib/prisma";
import type { CreateQuoteInput } from "@/schemas/quote";

export default async function NewQuotePage() {
  // Check for an authenticated session
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Only ADMINs or AUTHORS are allowed for quote creation
  if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
    redirect("/unauthorized");
  }

  // Fetch categories, author profiles, and global gallery items in parallel
  const [categories, authorProfiles, galleryItems] = await Promise.all([
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
    }),
    db.gallery.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const initialData: Partial<CreateQuoteInput> = {
    content: "",
    categoryId: "",
    authorProfileId: "",
    galleryImages: galleryItems
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Create a New Quote</h1>
      <QuoteForm 
        categories={categories} 
        authorProfiles={authorProfiles}
        initialData={initialData}
      />
      
      {session.user.role === "ADMIN" && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Create a New Category</h2>
          <CategoryForm />
        </div>
      )}
    </div>
  );
}