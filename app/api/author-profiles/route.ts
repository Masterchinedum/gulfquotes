import { NextResponse } from "next/server";
import { createAuthorProfileMiddleware } from "@/lib/middleware/auth";
import db from "@/lib/prisma";
import { formatZodError } from "@/lib/api-error";
import { 
  createAuthorProfileSchema,
  updateAuthorProfileSchema 
} from "@/schemas/author-profile";

const authorProfileAuth = createAuthorProfileMiddleware();

interface ApiError {
  code?: string;
  message: string;
  status?: number;
}

// Create new author profile
export async function POST(req: Request) {
  try {
    await authorProfileAuth();

    const body = await req.json();
    const validatedData = createAuthorProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    const authorProfile = await db.authorProfile.create({
      data: validatedData.data,
    });

    return NextResponse.json({ data: authorProfile });
  } catch (error: unknown) {
    console.error("[AUTHOR_PROFILE_POST]", error);
    const apiError = error as ApiError;
    return NextResponse.json(
      { 
        error: { 
          code: apiError.code || "INTERNAL_ERROR", 
          message: apiError.message || "Internal server error" 
        } 
      },
      { status: apiError.status || 500 }
    );
  }
}

// Get author profiles with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    
    const authorProfiles = await db.authorProfile.findMany({
      where: query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ]
      } : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: authorProfiles });
  } catch (error) {
    console.error("[AUTHOR_PROFILE_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Update author profile
export async function PATCH(req: Request) {
  try {
    await authorProfileAuth();

    const body = await req.json();
    const validatedData = updateAuthorProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: formatZodError(validatedData.error) },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validatedData.data;

    const authorProfile = await db.authorProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: authorProfile });
  } catch (error: unknown) {
    console.error("[AUTHOR_PROFILE_PATCH]", error);
    const apiError = error as ApiError;
    return NextResponse.json(
      { 
        error: { 
          code: apiError.code || "INTERNAL_ERROR", 
          message: apiError.message || "Internal server error" 
        } 
      },
      { status: apiError.status || 500 }
    );
  }
}