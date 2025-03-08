import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SearchAnalyticsDashboard } from "./components/SearchAnalyticsDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Analytics | Quoticon",
  description: "Search analytics dashboard for monitoring user search patterns"
};

export default async function SearchAnalyticsPage() {
  // Check authentication and authorization
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only allow ADMIN role
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Search Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor search patterns, popular queries, and identify areas for content improvement.
        </p>
      </div>
      
      <SearchAnalyticsDashboard />
    </div>
  );
}