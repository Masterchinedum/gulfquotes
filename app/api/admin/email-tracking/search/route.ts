// app/api/admin/email-tracking/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import EmailTrackingService from "@/lib/services/tracking/email-tracking.service";
import db from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    // Get email from query params
    const searchUrl = new URL(req.url);
    const email = searchUrl.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Email parameter is required" } },
        { status: 400 }
      );
    }
    
    // Search in-memory events first (more recent)
    const memoryEvents = EmailTrackingService.getRecentEvents(100)
      .filter(event => event.data.email.toLowerCase().includes(email.toLowerCase()));
    
    // Search database for older events
    const dbEvents = await db.emailLog.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    // Map database events to the same format as memory events
    const mappedDbEvents = dbEvents.map(dbEvent => ({
      id: dbEvent.id,
      type: dbEvent.type,
      createdAt: dbEvent.createdAt,
      data: dbEvent.data as Record<string, unknown>
    }));
    
    // Combine results, removing duplicates
    const memoryEventIds = new Set(memoryEvents.map(e => e.id));
    const combinedEvents = [
      ...memoryEvents,
      ...mappedDbEvents.filter(e => !memoryEventIds.has(e.id))
    ];
    
    return NextResponse.json({
      events: combinedEvents
    });
  } catch (error) {
    console.error("Error searching email tracking data:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to search email tracking data" } },
      { status: 500 }
    );
  }
}