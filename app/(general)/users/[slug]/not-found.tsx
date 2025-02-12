import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2">
            <UserX className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Profile Not Found</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            The user profile you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <div className="flex justify-center">
            <Button asChild variant="default">
              <Link href="/users">Back to Users</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}