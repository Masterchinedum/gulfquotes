'use client';

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import type { UserErrorCode } from "@/types/api/users";
import { ReloadButton } from "@/components/reload-button";

interface ErrorProps {
  error: Error & { digest?: string; code?: UserErrorCode };
  reset: () => void;
}

export default function Error({ error}: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Profile Error:', error);
  }, [error]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Error</h2>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          {error.code === "UNAUTHORIZED" && "Please sign in to view this profile."}
          {error.code === "NOT_FOUND" && "The requested profile could not be found."}
          {error.code === "BAD_REQUEST" && "Invalid profile request."}
          {!error.code && "An unexpected error occurred while loading the profile."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button
          variant="outline"
          asChild
        >
          <Link href="/users">Back to Users</Link>
        </Button>
        {error.code !== "NOT_FOUND" && <ReloadButton />}
      </CardFooter>
    </Card>
  );
}