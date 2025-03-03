// app/api/admin/email-tracking/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import EmailTrackingService from "@/lib/services/tracking/email-tracking.service";
// Remove unused db import

export async function GET() { // Remove unused req parameter
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Only allow ADMIN role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin permission required" } },
        { status: 403 }
      );
    }

    // Get in-memory stats
    const stats = EmailTrackingService.getStats();
    
    // Get recent events (in-memory)
    const events = EmailTrackingService.getRecentEvents(50);

    return NextResponse.json({
      stats,
      events,
    });
  } catch (error) {
    console.error("Error fetching email tracking data:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch email tracking data" } },
      { status: 500 }
    );
  }
}