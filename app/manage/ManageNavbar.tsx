"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Quote,
  Users,
  Settings,
  PlusCircle,
  LayoutDashboard,
  Image,
  Mail // Add this import
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/manage",
    icon: LayoutDashboard
  },
  {
    title: "Create Quote",
    href: "/manage/quotes/create",
    icon: PlusCircle
  },
  {
    title: "Manage Quotes",
    href: "/manage/quotes",
    icon: Quote
  },
  {
    title: "Create Author",
    href: "/manage/author-profiles/create",
    icon: PlusCircle
  },
  {
    title: "Manage Authors",
    href: "/manage/author-profiles",
    icon: Users
  },
  {
    title: "Media Gallery",
    href: "/manage/gallery",
    icon: Image
  },
  {
    title: "Email Dashboard", // Add this new item
    href: "/manage/email-dashboard",
    icon: Mail,
    admin: true // Only show to admin
  },
  {
    title: "Settings",
    href: "/users/settings",
    icon: Settings
  }
];

export function ManageNavbar() {
  const pathname = usePathname();
  
  // Get user role from localStorage (client-side only)
  let isAdmin = false;
  if (typeof window !== "undefined") {
    try {
      const sessionData = localStorage.getItem("sessionData");
      if (sessionData) {
        const { user } = JSON.parse(sessionData);
        isAdmin = user?.role === "ADMIN";
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }

  return (
    <div className="w-64 min-h-screen bg-muted/30 border-r px-3 py-4 space-y-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Management
        </h2>
      </div>
      <nav className="space-y-1">
        {navItems
          .filter(item => !item.admin || isAdmin)
          .map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  pathname === item.href && "bg-muted"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))
        }
      </nav>
    </div>
  );
}