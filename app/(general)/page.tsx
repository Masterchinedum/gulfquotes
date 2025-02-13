import { HeroSection } from "@/components/home/HeroSection";
import { HomeLayout } from "@/components/home/HomeLayout";
// import { Shell } from "@/components/shells/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
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
          {/* Featured Quotes Section */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Featured Quotes</h2>
              <p className="text-muted-foreground">
                Discover today&apos;s most inspiring quotes
              </p>
            </div>
            
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="hover:bg-muted/50 transition-colors shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <p className="text-muted-foreground italic">
                      &quot;This is a placeholder for a featured quote.&quot;
                    </p>
                    <p className="text-sm mt-2">- Author Name</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </HomeLayout>
      </div>
    </div>
  );
}