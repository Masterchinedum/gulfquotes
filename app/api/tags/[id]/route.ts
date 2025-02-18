// app/api/tags/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { TagResponse } from "@/types/api/tags";

export async function DELETE(
  req: NextRequest
): Promise<NextResponse<TagResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    // Extract tag ID from the URL
    const id = req.url.split('/tags/')[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Tag ID is required" } },
        { status: 400 }
      );
    }

    const tagWithCount = await db.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quotes: true }
        }
      }
    });

    if (!tagWithCount) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Tag not found" } },
        { status: 404 }
      );
    }

    if (tagWithCount._count.quotes > 0) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Cannot delete tag that is still in use" } },
        { status: 400 }
      );
    }

    const deletedTag = await db.tag.delete({
      where: { id }
    });

    return NextResponse.json({ data: deletedTag });

  } catch (error) {
    console.error("[TAG_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}