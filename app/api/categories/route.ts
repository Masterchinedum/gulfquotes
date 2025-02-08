// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/prisma";
import { slugify } from "@/lib/utils"; // Import slugify utility to generate category slugs

// Define a Zod schema for the category creation input
const categoryCreateSchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export async function POST(request: Request) {
  try {
    // Parse the request JSON body
    const body = await request.json();
    // Validate the input using the Zod schema
    const { name } = categoryCreateSchema.parse(body);

    // Generate a slug from the category name
    const slug = slugify(name);

    // Interact with the database to create a new category including the slug
    const category = await db.category.create({
      data: { name, slug },
    });

    // Return the created category in the response
    return NextResponse.json({ category });
  } catch (error: unknown) {
    // If validation fails, return the error messages with a 400 status code
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    // Log unexpected errors and return a 500 status code
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}