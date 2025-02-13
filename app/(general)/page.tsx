import { HeroSection } from "@/components/home/HeroSection";
import { Shell } from "@/components/shells/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <Shell>
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Featured Quotes Section */}
        <section className="container py-12 md:py-16">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Featured Quotes</h2>
              <p className="text-muted-foreground mt-2">
                Discover today&apos;s most inspiring quotes
              </p>
            </div>
            
            {/* Featured Quotes Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Placeholder Cards */}
              {[1, 2, 3].map((i) => (
                <Card key={i} className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle>Featured Quote {i}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic">
                      &quot;This is a placeholder for a featured quote.&quot;
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Categories Section */}
        <section className="container py-12 md:py-16 bg-muted/50">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Popular Categories</h2>
              <p className="text-muted-foreground mt-2">
                Browse quotes by your favorite topics
              </p>
            </div>

            {/* Categories Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {/* Placeholder Category Cards */}
              {["Motivation", "Leadership", "Success", "Wisdom"].map((category) => (
                <Card key={category} className="hover:bg-muted transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <h3 className="font-semibold">{category}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.floor(Math.random() * 100)} quotes
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}