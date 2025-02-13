import { HeroSection } from "@/components/home/HeroSection";
import { HomeLayout } from "@/components/home/HomeLayout";
import { FeaturedQuotes } from "@/components/home/FeaturedQuotes";
import { PopularCategories } from "@/components/home/PopularCategories";
import { TrendingQuotes } from "@/components/home/TrendingQuotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <div className="container px-4 md:px-6 py-6 md:py-16 space-y-16">
        <PopularCategories />
        <TrendingQuotes />
        <HomeLayout
          sidebar={
            <div className="space-y-6">
              {/* Daily Quote */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="italic text-muted-foreground">
                    &quot;The best way to predict the future is to create it.&quot;
                  </blockquote>
                  <p className="text-sm mt-2">- Peter Drucker</p>
                </CardContent>
              </Card>

              {/* Reading Challenge */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Saved Quotes: 0/100
                    </p>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-full w-0 bg-primary rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        >
          <FeaturedQuotes />
        </HomeLayout>
      </div>
    </div>
  );
}