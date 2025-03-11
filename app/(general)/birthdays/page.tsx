import { BirthdayCalendar } from "@/components/authors/BirthdayCalendar";
import { Suspense } from "react";
import { getTodaysDate } from "@/lib/date-utils";

export const metadata = {
  title: "Author Birthdays | gulfquotes",
  description: "Explore quotes from authors by their birthdays",
}

export default function BirthdaysPage() {
  const today = getTodaysDate();
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Author Birthdays</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <p className="text-muted-foreground mb-4">
            Explore quotes from authors born on specific days throughout the year.
            Select a date from the calendar below to see authors born on that day.
          </p>
          
          <Suspense fallback={<div>Loading calendar...</div>}>
            <BirthdayCalendar 
              initialMonth={today.month} 
              className="mb-8" 
            />
          </Suspense>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Born Today</h2>
          <Suspense fallback={<div>Loading today&apos;s authors...</div>}>
            {/* Component to display authors born today */}
            {/* We'll implement this in Phase 6 */}
          </Suspense>
        </div>
      </div>
    </div>
  )
}