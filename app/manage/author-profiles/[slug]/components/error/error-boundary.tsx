// In app/manage/author-profiles/[slug]/components/error-boundary.tsx
'use client';

import { ErrorState } from "./error";

export function ErrorBoundary({ message }: { message: string }) {
  return (
    <ErrorState 
      message={message}
      onRetry={() => window.location.reload()} 
    />
  );
}