// components/home/HeroSection.tsx
import { SearchField } from "@/components/search/SearchField";
import { cn } from "@/lib/utils";
import { BookMarked, Sparkles, TrendingUp } from "lucide-react";
import { QuickActions } from "./QuickActions";

export function HeroSection() {
  return (
    <section className={cn(
      "relative w-full min-h-[80vh]",
      "flex flex-col items-center justify-center",
      "bg-gradient-to-b from-background via-background/50 to-muted/20",
      "border-b"
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      </div>

      <div className="container relative max-w-5xl mx-auto text-center space-y-8 px-4">
        {/* Main Headline */}
        <h1 className={cn(
          "text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight",
          "bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70",
          "bg-clip-text text-transparent"
        )}>
          Your Personal Collection of Wisdom
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Discover, collect, and share meaningful quotes that inspire and transform.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto w-full">
          <SearchField />
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>10k+ Quotes</span>
          </div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            <span>1k+ Collections</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>New Quotes Daily</span>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </section>
  );
}