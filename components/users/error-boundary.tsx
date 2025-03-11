import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: {
    code?: string;
    message: string;
    details?: Record<string, unknown>; // Changed from any to unknown
  };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    console.error("Profile Error:", error);
  }, [error]);

  // Define more specific error messages and actions
  const errorConfig = {
    UNAUTHORIZED: {
      title: "Authentication Required",
      message: "Please sign in to view this profile.",
      primaryAction: { label: "Sign In", href: "/auth/login" },
      secondaryAction: { label: "Go Home", href: "/" }
    },
    NOT_FOUND: {
      title: "Profile Not Found",
      message: "The requested profile could not be found. It may have been removed or you may have followed an incorrect link.",
      primaryAction: { label: "Browse Users", href: "/users" },
      secondaryAction: { label: "Go Home", href: "/" }
    },
    FORBIDDEN: {
      title: "Access Denied",
      message: "You don't have permission to view this profile.",
      primaryAction: { label: "Go Back", action: () => window.history.back() },
      secondaryAction: { label: "Go Home", href: "/" }
    },
    BAD_REQUEST: {
      title: "Invalid Request",
      message: "There was a problem with your request to view this profile.",
      primaryAction: { label: "Try Again", action: reset },
      secondaryAction: { label: "Go Home", href: "/" }
    },
    default: {
      title: "Something Went Wrong",
      message: "An unexpected error occurred while loading the profile.",
      primaryAction: { label: "Try Again", action: reset },
      secondaryAction: { label: "Go Home", href: "/" }
    }
  };

  // Get the appropriate error configuration
  const errorType = error.code || "default";
  const config = errorConfig[errorType as keyof typeof errorConfig] || errorConfig.default;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-md mx-auto">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">{config.title}</h2>
      <p className="text-muted-foreground mb-6">
        {config.message}
        {error.details && (
          <span className="block mt-2 text-sm font-mono bg-muted p-2 rounded">
            {JSON.stringify(error.details, null, 2)}
          </span>
        )}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {config.primaryAction.href ? (
          <Button asChild>
            <Link href={config.primaryAction.href}>
              {config.primaryAction.label === "Go Back" ? (
                <ArrowLeft className="mr-2 h-4 w-4" />
              ) : config.primaryAction.label === "Try Again" ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : null}
              {config.primaryAction.label}
            </Link>
          </Button>
        ) : (
          <Button onClick={config.primaryAction.action}>
            {config.primaryAction.label === "Try Again" && (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {config.primaryAction.label}
          </Button>
        )}
        
        {config.secondaryAction.href ? (
          <Button variant="outline" asChild>
            <Link href={config.secondaryAction.href}>
              {config.secondaryAction.label === "Go Home" && (
                <Home className="mr-2 h-4 w-4" />
              )}
              {config.secondaryAction.label}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={config.secondaryAction.action}>
            {config.secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}