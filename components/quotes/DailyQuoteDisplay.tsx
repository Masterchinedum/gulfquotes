"use client";

import { useState } from "react";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DailyQuoteDisplayProps {
  quote: QuoteDisplayData;
  expiration: Date;
  className?: string;
  isCompact?: boolean;
}

export function DailyQuoteDisplay({
  quote,
  expiration,
  className,
  isCompact = false
}: DailyQuoteDisplayProps) {
  // Format remaining time until expiration
  const [timeRemaining, setTimeRemaining] = useState<string>(
    formatDistanceToNow(new Date(expiration), { addSuffix: true })
  );
  
  // In compact mode, we render a simpler version for the sidebar
  if (isCompact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Quote of the Day</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Refreshes {timeRemaining}
          </Badge>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <blockquote className="italic text-muted-foreground">
            &quot;{quote.content}&quot;
          </blockquote>
          <p className="text-sm mt-2">- {quote.authorProfile.name}</p>
        </CardContent>
        <CardFooter className="pt-2 pb-4 px-4">
          <p className="text-xs text-muted-foreground">
            From the category{" "}
            <span className="font-medium">{quote.category.name}</span>
          </p>
        </CardFooter>
      </Card>
    );
  }
  
  // Full display mode
  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Quote of the Day</h2>
        </div>
        <Badge variant="outline">Refreshes {timeRemaining}</Badge>
      </div>
      
      <QuoteCard quote={quote} showActions={true} />
    </div>
  );
}