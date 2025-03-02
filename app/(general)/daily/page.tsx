import { getDailyQuote } from "@/actions/daily-quote";
import { DailyQuoteDisplay } from "@/components/quotes/DailyQuoteDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Quote | Quoticon",
  description: "A new inspiring quote every day",
};

export default async function DailyQuotePage() {
  // Fetch the daily quote
  const { data, error } = await getDailyQuote();
  
  if (error) {
    return (
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load the daily quote</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.quote) {
    return (
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Getting today&apos;s quote of the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center">
              <div className="animate-pulse flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <p>Loading daily quote...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Quote of the Day</h1>
      <p className="text-muted-foreground mb-8">
        A new inspiring quote every day to spark your creativity and motivation.
      </p>
      
      <DailyQuoteDisplay 
        quote={data.quote} 
        expiration={data.expiration} 
      />
      
      <div className="mt-12 prose prose-quoteless dark:prose-invert max-w-none">
        <h2>About Daily Quotes</h2>
        <p>
          Every day at midnight (UTC+4), a new quote is selected to inspire
          your day. Each quote is carefully chosen from our collection and
          won&apos;t be repeated for at least 30 days.
        </p>
        <p>
          Save your favorite daily quotes to your collection or share them with
          friends and family.
        </p>
      </div>
    </div>
  );
}