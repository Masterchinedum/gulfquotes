import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-destructive">Access Denied</h1>
        
        <div className="max-w-md">
          <p className="text-muted-foreground mb-4">
            Sorry, you don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/">Return Home</Link>
          </Button>
          
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Unauthorized Access',
  description: 'You do not have permission to access this page'
};