import { HeroSection } from "@/components/home/HeroSection";
import { HomeLayout } from "@/components/home/HomeLayout";
import { FeaturedQuotes } from "@/components/home/FeaturedQuotes";
import { PopularCategories } from "@/components/home/PopularCategories";
import { TrendingQuotes } from "@/components/home/TrendingQuotes";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <div className="container px-4 md:px-6 py-6 md:py-16 space-y-16">
        <PopularCategories />
        <TrendingQuotes />
        <HomeLayout>
          <FeaturedQuotes />
        </HomeLayout>
      </div>
    </div>
  );
}