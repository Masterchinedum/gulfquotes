// components/home/HeroSection.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function HeroSection() {
  return (
    <div className={cn(
      "w-full min-h-[70vh]",
      "flex flex-col items-center justify-center",
      "bg-gradient-to-b from-background to-muted",
      "px-4 py-16 md:py-24"
    )}>
      <div className="container max-w-5xl mx-auto text-center space-y-8">
        {/* Main Headline */}
        <h1 className={cn(
          "text-4xl md:text-6xl font-bold tracking-tight",
          "bg-gradient-to-r from-foreground to-foreground/70",
          "bg-clip-text text-transparent"
        )}>
          Discover and Share Inspiring Quotes
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Your daily source of wisdom, inspiration, and thought-provoking quotes from great minds throughout history.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button size="lg" asChild>
            <Link href="/browse">
              Explore Quotes
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">
              Start Contributing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}