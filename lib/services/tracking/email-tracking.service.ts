// lib/services/tracking/email-tracking.service.ts
import db from "@/lib/prisma";
import { Prisma } from "@prisma/client";
// Remove unused imports
// import { NextRequest, NextResponse } from "next/server";

// Define proper interfaces for better type safety
interface WebhookPayload {
  type: string;
  data: {
    id?: string;
    email: string;
    tags?: { name: string; value: string }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface EmailLogData {
  email?: string;
  userId?: string;
  subject?: string;
  error?: string;
  tags?: { name: string; value: string }[];
  [key: string]: unknown;
}

export interface EmailTag {
  name: string;
  value: string;
}

/**
 * Event types from Resend webhooks
 * @see https://resend.com/docs/dashboard/webhooks/introduction
 */
export enum EmailEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  DELIVERY_DELAYED = 'delivery_delayed',
  COMPLAINED = 'complained',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked'
}

export interface EmailEvent {
  id: string;
  type: EmailEventType;
  createdAt: Date;
  data: {
    email: string;
    tags?: EmailTag[]; // Use the EmailTag interface
    subject?: string;
    userId?: string;
    quoteId?: string;
    authorId?: string;
    // Add any other properties
    [key: string]: unknown;
  };
}

interface EmailStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  delayed: number;
}

/**
 * Service to handle tracking email events
 */
export class EmailTrackingService {
  // In-memory storage for events and stats
  private static events: EmailEvent[] = [];
  private static stats: EmailStats = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    delayed: 0,
  };

  /**
   * Track an email send event
   */
  static async trackEmailSend(
    email: string,
    userId: string | undefined,
    subject: string,
    tags?: { [key: string]: string }[]
  ): Promise<void> {
    try {
      console.log(`✉️ Email sent to ${email}: ${subject}`);
      
      this.events.push({
        id: this.generateEventId(),
        type: EmailEventType.SENT,
        createdAt: new Date(),
        data: {
          email,
          userId,
          subject,
          tags
        }
      });
      
      this.stats.sent++;
      
      // Optional: Log to database
      if (process.env.NODE_ENV === 'production') {
        await this.logToDatabase(EmailEventType.SENT, email, { userId, subject });
      }
    } catch (error) {
      console.error("Error tracking email send:", error);
    }
  }

  /**
   * Process a webhook event from Resend
   */
  static async processWebhookEvent(
    payload: WebhookPayload
  ): Promise<void> {
    try {
      const { type, data } = payload;
      if (!type || !data || !data.email) {
        console.error("Invalid webhook payload", payload);
        return;
      }

      // Update stats
      switch (type) {
        case EmailEventType.DELIVERED:
          this.stats.delivered++;
          break;
        case EmailEventType.OPENED:
          this.stats.opened++;
          break;
        case EmailEventType.CLICKED:
          this.stats.clicked++;
          break;
        case EmailEventType.BOUNCED:
          this.stats.bounced++;
          break;
        case EmailEventType.COMPLAINED:
          this.stats.complained++;
          break;
        case EmailEventType.DELIVERY_DELAYED:
          this.stats.delayed++;
          break;
      }

      // Store event
      this.events.push({
        id: data.id || this.generateEventId(),
        type: type as EmailEventType,
        createdAt: new Date(),
        data: {
          email: data.email,
          tags: data.tags,
        }
      });

      // Log to database in production
      if (process.env.NODE_ENV === 'production') {
        await this.logToDatabase(type as EmailEventType, data.email, data);
      }

      console.log(`📊 Email event: ${type} for ${data.email}`);
    } catch (error) {
      console.error("Error processing webhook event:", error);
    }
  }

  /**
   * Get email stats (for admin dashboard)
   */
  static getStats(): EmailStats {
    return { ...this.stats }; // Return a copy to avoid mutations
  }

  /**
   * Get recent email events with optional filtering
   */
  static getRecentEvents(limit = 50, type?: EmailEventType): EmailEvent[] {
    let filteredEvents = this.events;
    
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }
    
    return filteredEvents
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Track delivery error
   */
  static async trackDeliveryError(
    email: string,
    error: Error | unknown,
    tags?: { [key: string]: string }[]
  ): Promise<void> {
    console.error(`❌ Email delivery error for ${email}:`, error);
    
    // Store error event
    this.events.push({
      id: this.generateEventId(),
      type: EmailEventType.BOUNCED, // Use bounced as a catch-all for errors
      createdAt: new Date(),
      data: {
        email,
        tags,
        subject: 'Delivery error'
      }
    });
    
    this.stats.bounced++;
    
    // Optional: Log to database
    if (process.env.NODE_ENV === 'production') {
      await this.logToDatabase(
        EmailEventType.BOUNCED, 
        email, 
        { error: error instanceof Error ? error.message : JSON.stringify(error) }
      );
    }
  }

  /**
   * Log event to database
   * This is a more permanent storage solution for production use
   */
  private static async logToDatabase(
    type: EmailEventType, 
    email: string, 
    data: EmailLogData
  ): Promise<void> {
    try {
      // For now, we'll implement a simple logging mechanism
      // In a full implementation, you might want to create a dedicated model for email events
      await db.emailLog.create({
        data: {
          type,
          email,
          data: data as Prisma.JsonObject,
        }
      });
    } catch (error) {
      console.error("Failed to log email event to database:", error);
    }
  }

  /**
   * Generate a unique ID for an event
   */
  private static generateEventId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export default EmailTrackingService;