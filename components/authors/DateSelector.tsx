"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MONTH_NAMES_CAPITALIZED, 
  generateBirthdayPath, 
  getDaysInMonth 
} from "@/lib/date-utils";

interface DateSelectorProps {
  className?: string;
  variant?: "default" | "compact";
  initialMonth?: number;
  initialDay?: number;
  onDateSelected?: (month: number, day: number) => void;
}

export function DateSelector({ 
  className = "", 
  variant = "default", 
  initialMonth, 
  initialDay,
  onDateSelected 
}: DateSelectorProps) {
  // Get current date for defaults if none provided
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDay = today.getDate();

  // State for selected month and day
  const [month, setMonth] = useState<number>(initialMonth || currentMonth);
  const [day, setDay] = useState<number>(initialDay || currentDay);
  
  // Available days based on selected month
  const [availableDays, setAvailableDays] = useState<number[]>(getDaysInMonth(month));

  const router = useRouter();

  // Update available days when month changes
  useEffect(() => {
    setAvailableDays(getDaysInMonth(month));
    
    // Ensure selected day is valid for the new month
    if (day > getDaysInMonth(month).length) {
      setDay(getDaysInMonth(month).length);
    }
  }, [month, day]);

  // Navigate to birthday page
  const handleViewBirthdays = () => {
    if (month && day) {
      const path = generateBirthdayPath(day, month);
      
      if (onDateSelected) {
        onDateSelected(month, day);
      } else {
        router.push(path);
      }
    }
  };

  // Render a compact or default version
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Select
          value={month.toString()}
          onValueChange={(value) => setMonth(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES_CAPITALIZED.map((monthName, index) => (
              <SelectItem key={`month-${index + 1}`} value={(index + 1).toString()}>
                {monthName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={day.toString()}
          onValueChange={(value) => setDay(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {availableDays.map((d) => (
              <SelectItem key={`day-${d}`} value={d.toString()}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleViewBirthdays}
          aria-label="View authors with this birthday"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Default full variant
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle>Find Authors by Birthday</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value, 10))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES_CAPITALIZED.map((monthName, index) => (
                  <SelectItem key={`month-${index + 1}`} value={(index + 1).toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Select
              value={day.toString()}
              onValueChange={(value) => setDay(parseInt(value, 10))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map((d) => (
                  <SelectItem key={`day-${d}`} value={d.toString()}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Button 
              onClick={handleViewBirthdays} 
              className="w-full"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              View Birthdays
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}