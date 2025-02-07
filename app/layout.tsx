import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export const metadata = {
  title: "Quoticon - Inspiring Quotes for Every Moment",
  description:
    "Discover insightful, inspirational quotes on Quoticon. Your daily dose of inspiration on quotes, motivation, and more.",
  keywords: ["quotes", "inspiration", "motivation", "quoticon"],
  openGraph: {
    title: "Quoticon",
    description: "Discover insightful, inspirational quotes on Quoticon.",
    url: "https://quoticon.vercel.app", // update with your URL
    siteName: "Quoticon"
  },
  twitter: {
    card: "summary_large_image",
    title: "Quoticon",
    description: "Discover insightful, inspirational quotes on Quoticon."
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
        <SessionProvider session={session}>
          <div className="min-h-screen bg-background">
            {children}
            <Toaster richColors closeButton />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}