// app/manage/email-dashboard/components/UnauthorizedMessage.tsx
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UnauthorizedMessage() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
        You don&apos;t have permission to view this dashboard. Only administrators can access email tracking information.
      </AlertDescription>
    </Alert>
  );
}