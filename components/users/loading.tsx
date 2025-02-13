import React from "react";

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="loader"></div>
    </div>
  );
}