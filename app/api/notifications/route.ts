import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { notificationService } from "@/lib/services/notification/notification.service";
import { AppError } from "@/lib/api-error";
import { Notification } from "@prisma/client";

// Define response types for better type safety
interface NotificationsResponse {
  data?: {
    items: Notification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface MarkAllReadResponse {
  data?: {
    count: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET - Fetch user notifications with pagination and filtering
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<NotificationsResponse>> {
  try {
    // Authentication check
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
    const includeRead = searchParams.get("includeRead") !== "false";

    // Fetch notifications
    const notifications = await notificationService.getUserNotifications(
      session.user.id,
      { page, limit, includeRead }
    );

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
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

/**
 * PATCH - Mark all notifications as read
 */
export async function PATCH(): Promise<NextResponse<MarkAllReadResponse>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Mark all notifications as read
    const count = await notificationService.markAllAsRead(session.user.id);

    return NextResponse.json({ data: { count } });
  } catch (error) {
    console.error("[NOTIFICATIONS_MARK_ALL_READ]", error);
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