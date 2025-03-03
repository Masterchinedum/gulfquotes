// app/api/users/notification-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { z } from "zod";

// Define response types
interface NotificationSettingsResponse {
  data?: {
    emailNotifications: boolean;
    emailNotificationTypes: NotificationType[];
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Validation schema for update request
const updateSchema = z.object({
  emailNotifications: z.boolean(),
  emailNotificationTypes: z.array(
    z.enum([
      NotificationType.NEW_QUOTE,
      NotificationType.COMMENT,
      NotificationType.LIKE,
      NotificationType.FOLLOW,
      NotificationType.SYSTEM,
    ])
  ),
});

// GET - Fetch user's notification settings
export async function GET(): Promise<NextResponse<NotificationSettingsResponse>> {
  try {
    // Check authentication
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

    // Fetch user with notification settings
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        emailNotificationTypes: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Return user's notification settings
    return NextResponse.json({
      data: {
        emailNotifications: user.emailNotifications,
        emailNotificationTypes: user.emailNotificationTypes,
      },
    });
  } catch (error) {
    console.error("[NOTIFICATION_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PUT - Update user's notification settings
export async function PUT(
  req: NextRequest
): Promise<NextResponse<NotificationSettingsResponse>> {
  try {
    // Check authentication
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

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("[NOTIFICATION_SETTINGS_PUT]", error);
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON payload" } },
        { status: 400 }
      );
    }

    // Validate input data
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Invalid input data",
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Update user notification settings
    const { emailNotifications, emailNotificationTypes } = validationResult.data;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications,
        emailNotificationTypes,
      },
      select: {
        emailNotifications: true,
        emailNotificationTypes: true,
      },
    });

    // Return updated settings
    return NextResponse.json({
      data: {
        emailNotifications: updatedUser.emailNotifications,
        emailNotificationTypes: updatedUser.emailNotificationTypes,
      },
    });
  } catch (_error) {
    // Prefix with underscore to indicate it's intentionally partially used
    console.error("[NOTIFICATION_SETTINGS_PUT]", _error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}