// components/shared/LoginPrompt.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon, UserIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginPromptProps {
  title?: string;
  description?: string;
  callToAction?: string;
  redirectUrl?: string;
  useModal?: boolean;
  className?: string;
  variant?: "default" | "compact" | "inline";
  onClose?: () => void;
  action?: string;
  targetId?: string;
}

export function LoginPrompt({
  title = "Sign in to continue",
  description = "You need to be signed in to perform this action.",
  callToAction = "Sign in",
  redirectUrl,
  useModal = true,
  className,
  variant = "default",
  onClose,
  action,
  targetId
}: LoginPromptProps) {
  const router = useRouter();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  
  // Build callback URL with action parameters if specified
  let callbackUrl = redirectUrl || currentUrl;
  if (action && targetId) {
    const url = new URL(callbackUrl, window.location.origin);
    url.searchParams.append('action', action);
    url.searchParams.append('target', targetId);
    callbackUrl = url.toString();
  }
  
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  
  // Handle the click if not using modal
  const handleClick = () => {
    router.push(loginUrl);
  };
  
  // Compact variant just shows a button with minimal text
  if (variant === "compact") {
    return useModal ? (
      <LoginButton mode="modal">
        <Button size="sm" variant="secondary" className="gap-2">
          <UserIcon className="h-4 w-4" />
          {callToAction}
        </Button>
      </LoginButton>
    ) : (
      <Button size="sm" variant="secondary" onClick={handleClick} className="gap-2">
        <UserIcon className="h-4 w-4" />
        {callToAction}
      </Button>
    );
  }
  
  // Inline variant for embedding in text or small containers
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <p className="text-sm text-muted-foreground">{description}</p>
        {useModal ? (
          <LoginButton mode="modal">
            <Button size="sm" variant="link" className="p-0 h-auto">
              {callToAction}
            </Button>
          </LoginButton>
        ) : (
          <Button size="sm" variant="link" onClick={handleClick} className="p-0 h-auto">
            {callToAction}
          </Button>
        )}
      </div>
    );
  }
  
  // Default variant with full card
  return (
    <Card className={cn("border-dashed border-muted-foreground/30", className)}>
      {/* Add a close button in the header if onClose is provided */}
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <LockIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="rounded-full bg-muted p-3">
          <UserIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      </CardContent>
      <CardFooter>
        {useModal ? (
          <LoginButton mode="modal">
            <Button className="w-full">
              {callToAction}
            </Button>
          </LoginButton>
        ) : (
          <Button className="w-full" onClick={handleClick}>
            {callToAction}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}