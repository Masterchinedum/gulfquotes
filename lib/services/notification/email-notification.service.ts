// lib/services/notification/email-notification.service.ts
import { NotificationType } from "@prisma/client"; // Remove User import
import db from "@/lib/prisma";
import { sendNewQuoteEmail } from "@/lib/mail";

/**
 * Interface for tracking rate limiting
 */
interface RateLimitRecord {
  userId: string;
  authorId: string;
  timestamp: number;
}

/**
 * Service to handle email notification logic 
 */
export class EmailNotificationService {
  // In-memory rate limiting - store the last time an email was sent to a user for a particular author
  private static rateLimitStore: RateLimitRecord[] = [];
  private static RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in ms

  /**
   * Check if a user should receive email notifications for a specific notification type
   */
  static async shouldSendEmailNotification(
    userId: string, 
    notificationType: NotificationType
  ): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          emailNotifications: true,
          emailNotificationTypes: true
        }
      });

      if (!user) return false;

      // Check if user has enabled email notifications and this specific notification type
      return user.emailNotifications && 
             user.emailNotificationTypes.includes(notificationType);
    } catch (error) {
      console.error("Error checking email notification preferences:", error);
      // Default to not sending in case of error
      return false;
    }
  }

  /**
   * Prepare email data for a new quote notification
   */
  static async prepareNewQuoteEmailData(
    userId: string,
    quoteId: string,
    authorId: string,
    authorName: string
  ): Promise<{
    recipientEmail: string;
    recipientName: string;
    quoteContent: string;
    quoteSlug: string;
    authorName: string;
    authorSlug: string;
  } | null> {
    try {
      // Get user details
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true
        }
      });

      if (!user || !user.email) return null;

      // Get quote details
      const quote = await db.quote.findUnique({
        where: { id: quoteId },
        select: {
          content: true,
          slug: true
        }
      });

      if (!quote) return null;

      // Get author details
      const authorProfile = await db.authorProfile.findFirst({
        where: { id: authorId },
        select: {
          slug: true
        }
      });

      if (!authorProfile) return null;

      return {
        recipientEmail: user.email,
        recipientName: user.name || 'Reader',
        quoteContent: quote.content,
        quoteSlug: quote.slug,
        authorName,
        authorSlug: authorProfile.slug
      };
    } catch (error) {
      console.error("Error preparing new quote email data:", error);
      return null;
    }
  }

  /**
   * Check rate limit for sending emails to a user about a particular author
   * Returns true if email can be sent (not rate limited), false otherwise
   */
  static checkRateLimit(userId: string, authorId: string): boolean {
    const now = Date.now();
    
    // Find the most recent notification for this user + author combination
    const lastNotification = this.rateLimitStore.find(
      record => record.userId === userId && record.authorId === authorId
    );
    
    // If no previous notification or it's older than the rate limit window, allow sending
    if (!lastNotification || (now - lastNotification.timestamp) > this.RATE_LIMIT_WINDOW) {
      // Update or add rate limit record
      if (lastNotification) {
        lastNotification.timestamp = now;
      } else {
        this.rateLimitStore.push({
          userId,
          authorId,
          timestamp: now
        });
      }
      
      // Prune old records (older than 7 days)
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      this.rateLimitStore = this.rateLimitStore.filter(
        record => (now - record.timestamp) < ONE_WEEK
      );
      
      return true;
    }
    
    return false;
  }

  /**
   * Send email notification for new quote if appropriate
   * Handles preference checking, data preparation, and rate limiting
   */
  static async sendNewQuoteEmailIfApplicable(
    userId: string,
    quoteId: string,
    authorId: string,
    authorName: string
  ): Promise<boolean> {
    try {
      // Check user preferences
      const shouldSend = await this.shouldSendEmailNotification(userId, NotificationType.NEW_QUOTE);
      if (!shouldSend) return false;
      
      // Check rate limit
      if (!this.checkRateLimit(userId, authorId)) {
        console.log(`Rate limited: Email to user ${userId} about author ${authorId} skipped`);
        return false;
      }
      
      // Prepare email data
      const emailData = await this.prepareNewQuoteEmailData(userId, quoteId, authorId, authorName);
      if (!emailData) return false;
      
      // Send the email
      await sendNewQuoteEmail(
        emailData.recipientEmail,
        emailData.recipientName,
        emailData.quoteContent,
        emailData.quoteSlug,
        emailData.authorName,
        emailData.authorSlug
      );
      
      return true;
    } catch (error) {
      console.error(`Error sending new quote email to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Process batch of email notifications with rate limiting
   */
  static async processBatchEmails(
    followers: { 
      userId: string; 
      user?: { 
        id: string;
        name?: string | null;
        email?: string | null;
        emailNotifications: boolean;
        emailNotificationTypes: NotificationType[];
      } | null;
    }[],
    quoteId: string,
    authorId: string,
    authorName: string,
    authorSlug: string
  ): Promise<{ sent: number; skipped: number }> {
    let sent = 0;
    let skipped = 0;

    // Get quote content
    const quote = await db.quote.findUnique({
      where: { id: quoteId },
      select: { 
        content: true,
        slug: true
      }
    });
    
    if (!quote) return { sent, skipped: followers.length };

    // Process each follower
    for (const follower of followers) {
      if (
        follower.user?.email &&
        follower.user.emailNotifications &&
        follower.user.emailNotificationTypes.includes(NotificationType.NEW_QUOTE) &&
        this.checkRateLimit(follower.userId, authorId)
      ) {
        try {
          await sendNewQuoteEmail(
            follower.user.email,
            follower.user.name || 'Reader',
            quote.content,
            quote.slug,
            authorName,
            authorSlug
          );
          sent++;
        } catch (error) {
          console.error(`Failed to send email to ${follower.user.email}:`, error);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    return { sent, skipped };
  }
}

export default EmailNotificationService;