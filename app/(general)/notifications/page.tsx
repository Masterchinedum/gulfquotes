// app/(general)/notifications/page.tsx
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shells/shell";
import { NotificationList } from "@/components/notifications/NotificationList";

export const metadata: Metadata = {
  title: "Notifications | Quoticon",
  description: "Your notifications and updates",
};

interface NotificationsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    read?: string;
  };
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Parse search parameters
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.limit) || 10));
  const readFilter = searchParams.read;

  return (
    <Shell>
      <div className="container py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your notifications
          </p>
        </div>
        
        <NotificationList 
          initialPage={page} 
          initialLimit={limit} 
          initialReadFilter={readFilter}
        />
      </div>
    </Shell>
  );
}