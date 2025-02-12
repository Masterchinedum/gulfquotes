import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-none shadow-none">
        {/* Cover Image Skeleton */}
        <div className={cn(
          "relative h-32",
          "bg-muted animate-pulse"
        )}>
          {/* Avatar Skeleton */}
          <div className="absolute -bottom-12 left-4">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        </div>

        <CardContent className={cn("pt-14 space-y-4")}>
          {/* Profile Info Skeletons */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" /> {/* Name */}
              <Skeleton className="h-4 w-32" /> {/* Username */}
            </div>
            <Skeleton className="h-9 w-24" /> {/* Edit Button */}
          </div>

          {/* Bio Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex gap-4 pt-4 border-t">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}