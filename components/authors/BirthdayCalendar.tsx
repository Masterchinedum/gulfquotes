"use client";

import { useState} from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MONTH_NAMES_CAPITALIZED,
  getDaysInMonth,
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
  
  // Remove the daysWithAuthors state and related code since we're not using it anymore
  
  // Router for navigation
  const router = useRouter();

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
      
      cells.push(
        <Button
          key={`day-${day}`}
          variant="outline"
          className={cn(
            "h-10 w-10 p-0 font-normal",
            isToday && "border-primary font-semibold"
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
            {MONTH_NAMES_CAPITALIZED[month - 1]}
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
        
        {/* Remove the legend since we're no longer using the color indicator */}
      </CardContent>
    </Card>
  );
}