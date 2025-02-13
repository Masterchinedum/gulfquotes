"use client";

import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";
import { SearchField } from "@/components/search/SearchField";
import { Bell, BookOpen, Home, Users } from "lucide-react";

export function Navbar() {
  const { status } = useSession();

  return (
    <nav className={cn(
      "w-full",
      "bg-background border-b",
      "px-4 lg:px-8 py-2",
      "flex items-center justify-between",
      "sticky top-0 z-50"
    )}>
      {/* Left Section - Logo & Navigation */}
      <div className="flex items-center gap-8">
        <Link 
          href="/"
          className={cn(
            "text-xl font-bold",
            "text-foreground hover:text-foreground/90",
            "transition-colors"
          )}
        >
          Quoticon
        </Link>

        {/* Main Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link 
            href="/quotes"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen size={18} />
            <span>My Quotes</span>
          </Link>
          <Link 
            href="/browse"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users size={18} />
            <span>Browse</span>
          </Link>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl px-6">
        <SearchField />
      </div>

      {/* Right Section - Actions & Auth */}
      <div className="flex items-center gap-4">
        {status === "loading" ? (
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        ) : status === "authenticated" ? (
          <>
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell size={20} />
            </Button>
            
            {/* Messages */}
            {/* <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MessageSquare size={20} />
            </Button> */}
            
            {/* User Menu */}
            <UserButton />
          </>
        ) : (
          <LoginButton mode="modal">
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </LoginButton>
        )}
      </div>
    </nav>
  );
}