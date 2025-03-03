// app/manage/email-dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmailDashboard } from "./components/EmailDashboard";

export const metadata = {
  title: "Email Notifications Dashboard | Quoticon",
  description: "Monitor email notification activity and performance",
};

export default async function EmailDashboardPage() {
  // Check authentication and authorization
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only allow ADMIN role for this page
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Email Notifications Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor email notification activity, success rates, and troubleshoot delivery issues.
        </p>
      </div>
      
      <EmailDashboard />
    </div>
  );
}