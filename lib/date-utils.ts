/**
 * Date utilities for working with birthday-related features
 */

// Month name mappings
export const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export const MONTH_NAMES_CAPITALIZED = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Convert numeric month to month name
 */
export function getMonthName(month: number, capitalized = false): string {
  // Check if month is valid (1-12)
  if (month < 1 || month > 12) {
    throw new Error('Invalid month number. Month must be between 1 and 12.');
  }
  
  return capitalized 
    ? MONTH_NAMES_CAPITALIZED[month - 1] 
    : MONTH_NAMES[month - 1];
}

/**
 * Convert month name to numeric month
 */
export function getMonthNumber(monthName: string): number {
  const index = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  
  if (index === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }
  
  return index + 1; // Add 1 as months are 1-indexed
}

/**
 * Generate a URL path for birthday pages
 */
export function generateBirthdayPath(day: number, month: number | string): string {
  const monthStr = typeof month === 'number' 
    ? getMonthName(month) 
    : month.toLowerCase();
  
  return `/birthdays/${monthStr}_${day}`;
}

/**
 * Generate API path for birthday data
 */
export function generateBirthdayApiPath(day: number, month: number | string): string {
  const monthStr = typeof month === 'number' 
    ? getMonthName(month) 
    : month.toLowerCase();
  
  return `/api/birthdays/${monthStr}_${day}`;
}

/**
 * Format a birthdate with day, month, and optional year
 */
export function formatBirthdate(day: number, month: number, year?: number | null): string {
  const monthName = getMonthName(month, true);
  
  if (year) {
    return `${monthName} ${day}, ${year}`;
  }
  
  return `${monthName} ${day}`;
}

/**
 * Check if a date is valid
 */
export function isValidDate(day: number, month: number, year?: number): boolean {
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return false;
  }

  // Check specific month lengths
  if ([4, 6, 9, 11].includes(month) && day > 30) {
    return false;
  }

  // February special case
  if (month === 2) {
    if (year) {
      // Leap year check
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      return day <= (isLeapYear ? 29 : 28);
    } else {
      // Without year, accept up to 29 (giving benefit of doubt for leap year)
      return day <= 29;
    }
  }

  return true;
}

/**
 * Get the current day's dates (month and day)
 */
export function getTodaysDate(): { day: number; month: number } {
  const today = new Date();
  return {
    day: today.getDate(),
    month: today.getMonth() + 1 // JavaScript months are 0-indexed
  };
}

/**
 * Generate an array of all days in a month
 */
export function getDaysInMonth(month: number, year?: number): number[] {
  let daysCount = 31; // Default for months with 31 days
  
  if ([4, 6, 9, 11].includes(month)) {
    daysCount = 30;
  } else if (month === 2) {
    // February
    if (year) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      daysCount = isLeapYear ? 29 : 28;
    } else {
      daysCount = 29; // Assume leap year if no year provided
    }
  }
  
  return Array.from({ length: daysCount }, (_, i) => i + 1);
}