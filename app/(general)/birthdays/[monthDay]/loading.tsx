import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BirthdayPageLoading() {
  return (
    <div className="container py-8">
      {/* Page header skeleton */}
      <Skeleton className="h-10 w-3/4 max-w-md mb-2" />
      <Skeleton className="h-6 w-1/2 max-w-sm mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className="mb-6">
            <Skeleton className="h-7 w-40 mb-3" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[80px]" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
          
          <div className="hidden lg:block">
            <Skeleton className="h-7 w-40 mb-3" />
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </div>
        </div>
        
        {/* Main content area skeleton */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Generate 9 author card skeletons */}
            {Array(9).fill(0).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Pagination skeleton */}
          <div className="flex items-center justify-center mt-8">
            <div className="flex gap-1">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={`page-${i}`} className="h-10 w-10 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}