// components/quotes/RandomQuoteCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface RandomQuoteCardProps {
  quote?: QuoteDisplayData;
  isLoading: boolean;
  error?: string;
  isCompact?: boolean;
  className?: string;
  refreshing?: boolean;
}

export function RandomQuoteCard({
  quote,
  isLoading,
  error,
  isCompact = false,
  className,
  refreshing = false
}: RandomQuoteCardProps) {
  // Error state
  if (error) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-primary" />
            Random Quote
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading && !quote) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-primary" />
            Random Quote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted/60 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted/60 animate-pulse rounded w-full" />
            <div className="h-4 bg-muted/60 animate-pulse rounded w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact mode (for sidebar)
  if (isCompact && quote) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <RefreshCw className={cn("h-4 w-4 text-primary", refreshing && "animate-spin")} />
            <span className="text-sm font-semibold">Random Quote</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Refresh for more
          </Badge>
        </CardHeader>
        <AnimatePresence mode="wait">
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        </AnimatePresence>
      </Card>
    );
  }

  // Full display mode
  if (quote) {
    return (
      <div className={cn("space-y-4", className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className={cn("h-4 w-4 text-primary", refreshing && "animate-spin")} />
                    Random Quote
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <blockquote className="text-xl italic leading-relaxed">
                  &quot;{quote.content}&quot;
                </blockquote>
                
                <div className="flex items-center mt-6 gap-3">
                  <Link href={`/authors/${quote.authorProfile.slug}`} className="flex items-center gap-3 hover:underline">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={quote.authorProfile?.image || ""} alt={quote.authorProfile.name} />
                      <AvatarFallback>{quote.authorProfile.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{quote.authorProfile.name}</span>
                  </Link>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Link 
                  href={`/categories/${quote.category.slug}`}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  {quote.category.name}
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Fallback
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>Random Quote</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">No quote available</p>
      </CardContent>
    </Card>
  );
}