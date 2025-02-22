import { Skeleton } from "@/components/ui/skeleton";

export function QuoteLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="relative overflow-hidden aspect-[1.91/1]">
          {/* Background Skeleton */}
          <Skeleton className="absolute inset-0" />
          
          {/* Content Skeleton */}
          <div className="relative h-full p-6 flex flex-col justify-between">
            <div className="space-y-2 max-w-[80%]">
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
            
            {/* Author and Category Skeleton */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}