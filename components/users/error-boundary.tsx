import React from "react";

interface ErrorBoundaryProps {
  error: {
    code?: string;
    message: string;
  };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    console.error("Profile Error:", error);
  }, [error]);

  let errorMessage = "An unexpected error occurred while loading the profile.";
  if (error.code === "UNAUTHORIZED") {
    errorMessage = "Please sign in to view this profile.";
  } else if (error.code === "NOT_FOUND") {
    errorMessage = "The requested profile could not be found.";
  } else if (error.code === "BAD_REQUEST") {
    errorMessage = "Invalid profile request.";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="text-destructive">
        <h2 className="text-2xl font-semibold">Error</h2>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>
      <button onClick={reset} className="btn btn-primary">
        Try Again
      </button>
    </div>
  );
}