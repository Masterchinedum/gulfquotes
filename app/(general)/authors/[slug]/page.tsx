// app/(general)/authors/[slug]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { authorFollowService } from "@/lib/services/follow";
import { AuthorPageHeader } from "@/components/authors/AuthorPageHeader";
import { AuthorBioSection } from "@/components/authors/AuthorBioSection";
import type { Metadata } from "next";
// Remove the unused import
// import { fetchAuthors } from "@/lib/authors";

// Define interface for page props
interface AuthorPageProps {
  params: {
    slug: string;
  };
}

// Define an error type for our application errors
interface AppErrorWithCode {
  code?: string;
  message: string;
}

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params }: AuthorPageProps
): Promise<Metadata> {
  try {
    const author = await authorProfileService.getBySlug(params.slug);
    
    return {
      title: `${author.name} | Author Profile | Quoticon`,
      description: author.bio?.substring(0, 160) || `Quotes by ${author.name}`,
    };
  } catch { // Empty catch block since we don't need the error parameter
    return {
      title: "Author | Quoticon",
      description: "View author profile and quotes",
    };
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  // Get authenticated user (if any)
  const session = await auth();
  
  try {
    // Fetch author profile data
    const author = await authorProfileService.getBySlug(params.slug);
    
    if (!author) {
      notFound();
    }
    
    // Get quote count and follow status
    const [quoteCount, isFollowed] = await Promise.all([
      // Get quote count from the author profile
      authorProfileService.getQuoteCount(author.id),
      // Check if current user follows this author
      session?.user ? authorFollowService.getFollowStatus(author.id, session.user.id) : false
    ]);
    
    // Transform data to match expected format for the UI components
    const authorData = {
      id: author.id,
      name: author.name,
      slug: author.slug,
      bio: author.bio,
      born: author.born,
      died: author.died,
      image: author.images[0]?.url || null,
      influences: author.influences,
      quoteCount: quoteCount,
      followers: author.followers,
      isFollowed: isFollowed,
      totalQuotes: quoteCount,
    };

    return (
      <div className="container py-8 space-y-6">
        <Suspense fallback={<div>Loading author information...</div>}>
          <AuthorPageHeader author={authorData} />
        </Suspense>
        
        <Suspense fallback={<div>Loading author details...</div>}>
          <AuthorBioSection 
            bio={author.bio} 
            influences={author.influences}
          />
        </Suspense>
        
        {/* More sections will be added in future phases */}
      </div>
    );
  } catch (error) {
    console.error("[AUTHOR_PAGE]", error);
    
    // Handle different types of errors with proper typing
    if (isErrorWithCode(error) && error.code === "NOT_FOUND") {
      notFound();
    }
    
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load author profile. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}

// Type guard function to check if an error has a code property
function isErrorWithCode(error: unknown): error is AppErrorWithCode {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}