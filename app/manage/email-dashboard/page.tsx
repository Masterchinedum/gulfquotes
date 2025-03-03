// app/manage/email-dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmailDashboard } from "./components/EmailDashboard";
import { UnauthorizedMessage } from "./components/UnauthorizedMessage";

export const metadata = {
  title: "Email Notifications Dashboard | Quoticon",
  description: "Monitor email notification activity and performance",
};

export default async function EmailDashboardPage() {
  // Check authentication
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const isAdmin = session.user.role === "ADMIN";

  // Display the full dashboard only for admins
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Email Notifications Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor email notification activity, success rates, and troubleshoot delivery issues.
        </p>
      </div>
      
      {isAdmin ? (
        <EmailDashboard />
      ) : (
        <UnauthorizedMessage />
      )}
    </div>
  );
}