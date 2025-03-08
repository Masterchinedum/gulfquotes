import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { Providers } from './providers';
import { NotificationProvider } from '@/contexts/notification-context';

export const metadata = {
  title: "gulfquotes - Inspiring Quotes for Every Moment",
  description:
    "Discover insightful, inspirational quotes on gulfquotes. Your daily dose of inspiration on quotes, motivation, and more.",
  keywords: ["quotes", "inspiration", "motivation", "gulfquotes"],
  openGraph: {
    title: "gulfquotes",
    description: "Discover insightful, inspirational quotes on gulfquotes.",
    url: "https://gulfquotes.vercel.app", // update with your URL
    siteName: "gulfquotes"
  },
  twitter: {
    card: "summary_large_image",
    title: "gulfquotes",
    description: "Discover insightful, inspirational quotes on gulfquotes."
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="bg-background text-foreground">
      <body className="h-full">
        <Providers>
          <SessionProvider session={session}>
            <NotificationProvider>
              <div className="min-h-screen flex flex-col"> 
                <main className="flex-1">
                  {children}
                </main>
                <Toaster richColors closeButton />
              </div>
            </NotificationProvider>
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}