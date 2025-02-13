// components/general/Footer.tsx
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Branding & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link 
              href="/"
              className="text-xl font-bold"
            >
              Quoticon
            </Link>
            <p className="text-sm text-muted-foreground">
              Your personal collection of wisdom. Discover, collect, and share meaningful quotes that inspire and transform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/browse" className="text-muted-foreground hover:text-foreground transition">
                  Browse Quotes
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-muted-foreground hover:text-foreground transition">
                  Authors
                </Link>
              </li>
              <li>
                <Link href="/daily" className="text-muted-foreground hover:text-foreground transition">
                  Daily Quote
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="font-semibold">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={cn(
          "border-t mt-8 pt-6",
          "flex flex-col md:flex-row items-center justify-between gap-4"
        )}>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Quoticon. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <Link 
              href="https://twitter.com/quoticon" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link 
              href="https://linkedin.com/in/quoteicon" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}