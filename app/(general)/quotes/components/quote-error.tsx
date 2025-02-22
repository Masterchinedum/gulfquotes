import { Button } from "@/components/ui/button";

interface QuoteErrorProps {
  message: string;
  onRetry: () => void;
}

export function QuoteError({ message, onRetry }: QuoteErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h3 className="font-semibold">Something went wrong</h3>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  );
}