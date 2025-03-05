// hooks/use-featured-quotes.ts
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Interface for a featured quote
interface FeaturedQuote {
  id: string;
  content: string;
  slug: string;
  backgroundImage: string | null;
  featured: boolean;
  createdAt: string;
  authorProfile: {
    name: string;
    image?: string | null;
    slug: string;
  };
  category: {
    name: string;
    slug: string;
  };
  _count?: {
    quoteLikes?: number;
    comments?: number;
  };
}

interface FeaturedQuotesResponse {
  data: FeaturedQuote[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

interface UseFeaturedQuotesOptions {
  initialData?: FeaturedQuotesResponse;
  page?: number;
  limit?: number;
  categoryId?: string;
  authorProfileId?: string;
}

export function useFeaturedQuotes({
  initialData,
  page: initialPage = 1,
  limit: initialLimit = 9,
  categoryId,
  authorProfileId,
}: UseFeaturedQuotesOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current page from URL or fallback to initial value
  const currentPage = Number(searchParams.get('page')) || initialPage;
  const currentLimit = Number(searchParams.get('limit')) || initialLimit;
  
  // State for quotes data
  const [quotes, setQuotes] = useState<FeaturedQuote[]>(initialData?.data || []);
  const [pagination, setPagination] = useState({
    page: initialData?.page || currentPage,
    limit: initialData?.limit || currentLimit,
    total: initialData?.total || 0,
    hasMore: initialData?.hasMore || false,
  });
  
  // Status states
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotes when parameters change
  useEffect(() => {
    // If we have initial data and are on the first page, use that
    if (initialData && currentPage === 1 && !categoryId && !authorProfileId) {
      return;
    }
    
    const fetchFeaturedQuotes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Construct URL with query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: currentLimit.toString()
        });
        
        if (categoryId) params.set('categoryId', categoryId);
        if (authorProfileId) params.set('authorProfileId', authorProfileId);
        
        const response = await fetch(`/api/quotes/featured?${params}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to load featured quotes');
        }
        
        setQuotes(data.data.data);
        setPagination({
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.total,
          hasMore: data.data.hasMore
        });
      } catch (err) {
        console.error("Error fetching featured quotes:", err);
        setError(err instanceof Error ? err.message : 'Failed to load featured quotes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeaturedQuotes();
  }, [initialData, currentPage, currentLimit, categoryId, authorProfileId]);

  // Helper for updating page
  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return {
    quotes,
    isLoading,
    error,
    pagination: {
      ...pagination,
      totalPages
    },
    setPage,
    hasNextPage: pagination.page < totalPages,
    hasPrevPage: pagination.page > 1,
    goToNextPage: () => setPage(pagination.page + 1),
    goToPrevPage: () => setPage(pagination.page - 1)
  };
}