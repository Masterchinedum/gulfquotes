import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchAnalyticsService } from "@/lib/services/search-analytics.service";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check authorization (admin only)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin permission required" },
        { status: 403 }
      );
    }

    // Get the time range parameter
    const url = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days")) || 30));
    
    // Get analytics data
    const data = await searchAnalyticsService.getAnalytics(days);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching search analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch search analytics" },
      { status: 500 }
    );
  }
}