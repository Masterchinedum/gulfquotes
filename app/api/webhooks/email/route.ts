// app/api/webhooks/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import EmailTrackingService from "@/lib/services/tracking/email-tracking.service";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook signature (in production, you should validate this)
    // const signature = req.headers.get('resend-signature');
    // Implement signature verification here
    
    // Parse the webhook payload
    const payload = await req.json();
    
    // Process the event
    await EmailTrackingService.processWebhookEvent(payload);
    
    // Return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing email webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}