import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
// import { Prisma } from "@prisma/client";
import type { UsersResponse, UserWhereInput } from "@/types/api/users";

export async function GET(req: Request): Promise<NextResponse<UsersResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    const search = searchParams.get("search")?.trim();

    // Calculate offset
    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: UserWhereInput = search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { userProfile: { username: { contains: search, mode: "insensitive" } } }
      ]
    } : {};

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          userProfile: {
            select: {
              username: true,
              bio: true,
              slug: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      db.user.count({ where: whereConditions })
    ]);

    return NextResponse.json({
      data: {
        items: users,
        total,
        hasMore: total > skip + users.length,
        page,
        limit
      }
    });

  } catch (error) {
    console.error("[USERS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}