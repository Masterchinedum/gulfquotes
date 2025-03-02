import { getDailyQuote } from "@/actions/daily-quote";
import { DailyQuoteDisplay } from "@/components/quotes/DailyQuoteDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export async function DailyQuoteSidebar() {
  const { data, error } = await getDailyQuote();
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load today&apos;s quote.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.quote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/daily" className="block hover:opacity-90 transition-opacity">
      <DailyQuoteDisplay
        quote={data.quote}
        expiration={data.expiration}
        isCompact={true}
      />
    </Link>
  );
}