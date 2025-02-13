import { HeroSection } from "@/components/home/HeroSection";
import { HomeLayout } from "@/components/home/HomeLayout";
import { FeaturedQuotes } from "@/components/home/FeaturedQuotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />

      <div className="container px-4 md:px-6 py-6 md:py-16 space-y-8">
        <HomeLayout
          sidebar={
            <div className="space-y-6">
              {/* Popular Categories */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Popular Categories</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {["Motivation", "Leadership", "Success", "Wisdom"].map((category) => (
                    <Card key={category} className="hover:bg-muted transition-colors cursor-pointer">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{category}</h3>
                          <span className="text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 100)} quotes
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Daily Quote */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Daily Quote</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <blockquote className="italic text-muted-foreground">
                    &quot;Success is not final, failure is not fatal: it is the courage to continue that counts.&quot;
                  </blockquote>
                  <p className="text-sm mt-2">- Winston Churchill</p>
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