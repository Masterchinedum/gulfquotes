import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { QuoteList } from "@/components/quotes/quote-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Shell } from "@/components/shells/shell";
import { quoteService } from "@/lib/services/quote.service";
import { Suspense } from "react";

// Add metadata
export const metadata = {
  title: "Quotes Management",
  description: "Manage your quotes collection"
};

export default async function QuotesPage() {
  // Check authentication
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  try {
    // Fetch initial quotes with author data
    const result = await quoteService.list({
      page: 1,
      limit: 10,
      include: {

        authorProfile: true, // Changed from author to authorProfile to match the schema
        category: true
      }
    });

    // Transform the quotes to match expected shape
    const transformedQuotes = result.items.map(quote => ({
      ...quote,
      author: {
        id: quote.authorProfile.id,
        name: quote.authorProfile.name,
        email: null,
        emailVerified: null,
        image: null,
        password: null,
        isTwoFactorEnabled: false,
        role: session.user.role
      }
    }));

    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage your quotes collection
                </p>
              </div>
              <Button asChild>
                <Link href="/manage/quotes/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quote
                </Link>
              </Button>
            </div>

            {/* Main Content */}
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/>
              </div>
            }>
              <QuoteList initialQuotes={transformedQuotes} />
            </Suspense>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[QUOTES_PAGE]", error); // Add error logging
    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <h3 className="font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                Failed to load quotes. Please try again later.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Try again
              </Button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }
}