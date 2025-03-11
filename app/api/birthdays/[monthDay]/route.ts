import { NextResponse } from "next/server";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { getMonthNumber, getMonthName } from "@/lib/date-utils";
import type { AuthorProfileListResponse } from "@/lib/services/interfaces/author-profile-service.interface";

export interface BirthdayApiResponse {
  data?: {
    authors: AuthorProfileListResponse;
    day: number;
    month: number;
    monthName: string;
    formattedDate: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET endpoint to fetch authors by birth date
 */
export async function GET(req: Request): Promise<NextResponse<BirthdayApiResponse>> {
  try {
    // Extract monthDay from URL path like other routes do
    const monthDay = req.url.split('/birthdays/')[1]?.split('/')[0];
    
    if (!monthDay || !monthDay.includes('_')) {
      return NextResponse.json(
        { 
          error: { 
            code: "BAD_REQUEST", 
            message: "Invalid format. Use 'month_day' (e.g., january_5)" 
          } 
        },
        { status: 400 }
      );
    }

    const [monthPart, dayStr] = monthDay.split('_');
    const day = parseInt(dayStr, 10);

    if (isNaN(day) || day < 1 || day > 31) {
      return NextResponse.json(
        { 
          error: { 
            code: "BAD_REQUEST", 
            message: "Invalid day. Day must be between 1 and 31" 
          } 
        },
        { status: 400 }
      );
    }

    // Convert month name to number - MODIFIED to handle numeric months too
    let month: number;
    try {
      // Check if monthPart is already a number
      if (/^\d+$/.test(monthPart)) {
        month = parseInt(monthPart, 10);
        if (month < 1 || month > 12) {
          throw new Error(`Invalid month number: ${monthPart}`);
        }
      } else {
        // Otherwise treat it as a name
        month = getMonthNumber(monthPart);
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? `Invalid month name: ${err.message}`
        : "Invalid month name";
        
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: errorMessage } },
        { status: 400 }
      );
    }

    // Extract pagination params from query string
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(
      50,
      parseInt(url.searchParams.get("limit") || "10", 10)
    );

    // Get authors born on this day and month
    const authors = await authorProfileService.getAuthorsByBirthday({
      day,
      month,
      page,
      limit
    });

    return NextResponse.json({
      data: {
        authors,
        day,
        month,
        monthName: getMonthName(month, true),
        formattedDate: `${getMonthName(month, true)} ${day}`,
      }
    });
  } catch (error) {
    console.error("[BIRTHDAYS_API]", error);
    
    return NextResponse.json(
      { 
        error: { 
          code: "INTERNAL_SERVER_ERROR", 
          message: "An error occurred while fetching birthday data" 
        } 
      },
      { status: 500 }
    );
  }
}