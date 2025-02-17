"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  error?: {
    digest?: string
    message?: string
  }
  reset?: () => void
  children: React.ReactNode
}

export function ErrorBoundary({ 
  error,
  reset,
  children 
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">
          {error.message || "Something went wrong"}
        </p>
        {reset && (
          <Button
            variant="outline"
            onClick={reset}
          >
            Try again
          </Button>
        )}
      </div>
    )
  }

  return children
}