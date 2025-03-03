import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { notificationService } from "@/lib/services/notification/notification.service";
import { AppError } from "@/lib/api-error";
import { Notification } from "@prisma/client";

// Define response types for better type safety
interface NotificationResponse {
  data?: Notification;
  error?: {
    code: string;
    message: string;
  };
}

interface DeleteNotificationResponse {
  data?: {
    success: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * PATCH - Mark a specific notification as read
 */
export async function PATCH(
  req: NextRequest
): Promise<NextResponse<NotificationResponse>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Add explicit check for user ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User ID is missing" } },
        { status: 401 }
      );
    }

    // Extract notification ID from URL
    const id = req.url.split('/notifications/')[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid notification ID" } },
        { status: 400 }
      );
    }

    // Mark notification as read
    const notification = await notificationService.markAsRead(id, session.user.id);

    return NextResponse.json({ data: notification });
  } catch (error) {
    console.error("[NOTIFICATION_MARK_READ]", error);
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
 * DELETE - Delete a specific notification
 */
export async function DELETE(
  req: NextRequest
): Promise<NextResponse<DeleteNotificationResponse>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Add explicit check for user ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User ID is missing" } },
        { status: 401 }
      );
    }

    // Extract notification ID from URL
    const id = req.url.split('/notifications/')[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid notification ID" } },
        { status: 400 }
      );
    }

    // Delete notification
    await notificationService.deleteNotification(id, session.user.id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("[NOTIFICATION_DELETE]", error);
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