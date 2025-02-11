"use client";

import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";
import SearchField from "@/components/SearchField";

export function Navbar() {
  const { status } = useSession();

  return (
    <nav className={cn(
      "w-full max-w-[600px]",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border rounded-lg shadow-sm",
      "px-4 md:px-6 py-3",
      "flex items-center justify-between",
      "transition-all duration-200"
    )}>
      {/* Logo/Brand Section */}
      <div className="flex items-center gap-6">
        <Link 
          href="/"
          className={cn(
            "text-lg font-semibold",
            "text-foreground hover:text-foreground/90",
            "transition-colors"
          )}
        >
          Quoticon
        </Link>
      </div>

      {/* Navigation Links Container */}
      <div className="hidden md:flex items-center gap-4">
        {status === "loading" && (
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        )}
      </div>

      <SearchField />

      {/* Authentication Section */}
      <div className="flex items-center gap-4">
        {status === "loading" ? (
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        ) : status === "unauthenticated" ? (
          <LoginButton mode="modal">
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </LoginButton>
        ) : (
          <UserButton />
        )}
      </div>
    </nav>
  );
}