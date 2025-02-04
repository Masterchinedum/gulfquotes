"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { UserDropdown } from "./UserDropdown"; 
import Logo from "@/public/logo.png";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src={Logo}
            alt="Logo"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-bold md:text-2xl">
            Quote<span className="text-primary">Icon</span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle />
          <Link 
            href="/post-job"
            className={buttonVariants({ 
              variant: "default",
              size: "sm"
            })}
          >
            Post Quotes
          </Link>
          {session?.user ? (
            <UserDropdown
              email={session.user.email as string}
              name={session.user.name as string}
              image={session.user.image as string}
            />
          ) : (
            <Link
              href="/login"
              className={buttonVariants({
                variant: "outline", 
                size: "sm"
              })}
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="text-left">
                <SheetTitle>
                  Quote<span className="text-primary">Icon</span>
                </SheetTitle>
                <SheetDescription>
                  Share and discover amazing quotes
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <Link
                  href="/"
                  className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/post-job"
                  className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Post Quotes
                </Link>
                {!session?.user && (
                  <Link
                    href="/login"
                    className="text-lg px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Login
                  </Link>
                )}
                {session?.user && (
                  <UserDropdown
                    email={session.user.email as string}
                    name={session.user.name as string}
                    image={session.user.image as string}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}