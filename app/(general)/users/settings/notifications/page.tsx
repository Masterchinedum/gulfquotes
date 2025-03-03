// app/(general)/users/settings/notifications/page.tsx
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shells/shell";
import { NotificationSettingsForm } from "./components/notification-settings-form";

export const metadata: Metadata = {
  title: "Notification Settings | Quoticon",
  description: "Manage your notification preferences",
};

export default async function NotificationSettingsPage() {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <Shell>
      <div className="container py-10 max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Control how and when you receive notifications from Quoticon
          </p>
        </div>
        
        <NotificationSettingsForm />
      </div>
    </Shell>
  );
}