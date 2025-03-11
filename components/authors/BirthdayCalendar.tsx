"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  MONTH_NAMES_CAPITALIZED, 
  getDaysInMonth, 
//   generateBirthdayPath,
  getMonthName
} from "@/lib/date-utils";

interface BirthdayCalendarProps {
  className?: string;
  initialMonth?: number;
  initialYear?: number;
  onDateSelected?: (day: number, month: number) => void;
}

export function BirthdayCalendar({
  className,
  initialMonth,
  initialYear,
  onDateSelected
}: BirthdayCalendarProps) {
  // Get current date for defaults
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // State for the selected month/year
  const [month, setMonth] = useState<number>(initialMonth || currentMonth);
  const [year, setYear] = useState<number>(initialYear || currentYear);
  
  // State for keeping track of days with authors (would be populated from API)
  const [daysWithAuthors, setDaysWithAuthors] = useState<number[]>([]);
  
  // Router for navigation
  const router = useRouter();

  // Effect to fetch authors for the current month when month/year changes
  useEffect(() => {
    async function fetchAuthorsForMonth() {
      try {
        // For now, simulate days with authors (will be replaced with API call)
        // In a real implementation, you'd fetch from your API which days have authors
        // Example API endpoint: /api/birthdays/month-summary/january
        const days = Array.from({ length: getDaysInMonth(month, year).length }, (_, i) => i + 1)
          .filter(() => Math.random() > 0.7); // Randomly mark some days as having authors
        
        setDaysWithAuthors(days);
      } catch (error) {
        console.error("Failed to fetch authors for month", error);
        setDaysWithAuthors([]);
      }
    }

    fetchAuthorsForMonth();
  }, [month, year]);

  // Navigate to previous month
  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Handle day selection
  const handleDayClick = (day: number) => {
    if (onDateSelected) {
      onDateSelected(day, month);
    } else {
      // Use month name instead of number
      const monthName = getMonthName(month);
      const path = `/birthdays/${monthName}_${day}`;
      router.push(path);
    }
  };

  // Generate days of the week
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Get days in the current month
  const daysInMonth = getDaysInMonth(month, year);
  
  // Get the day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  // Generate calendar grid
  const generateCalendarGrid = () => {
    const totalCells = Math.ceil((daysInMonth.length + firstDayOfMonth) / 7) * 7;
    const cells = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth.length; day++) {
      const isToday = day === currentDay && month === currentMonth && year === currentYear;
      const hasAuthors = daysWithAuthors.includes(day);
      
      cells.push(
        <Button
          key={`day-${day}`}
          variant={hasAuthors ? "default" : "outline"}
          className={cn(
            "h-10 w-10 p-0 font-normal",
            isToday && "border-primary font-semibold",
            hasAuthors && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => handleDayClick(day)}
        >
          {day}
        </Button>
      );
    }

    // Add empty cells for days after the last day of the month
    const remainingCells = totalCells - (daysInMonth.length + firstDayOfMonth);
    for (let i = 0; i < remainingCells; i++) {
      cells.push(<div key={`empty-end-${i}`} className="h-10 w-10" />);
    }

    return cells;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="px-5 pt-5 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle>Author Birthdays</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <div className="text-sm font-medium">
            {MONTH_NAMES_CAPITALIZED[month - 1]} {/* Remove the year display */}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center">
          {/* Weekday headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {generateCalendarGrid()}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary"></div>
            <span>Days with author birthdays</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}