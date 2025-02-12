"use client";

import { User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface ProfileHeaderProps {
  user: User & {
    userProfile?: {
      username: string | null;
      bio: string | null;
      slug: string;
    } | null;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === user.id;

  return (
    <Card className={cn("border-none shadow-none")}>
      {/* Cover Image Area */}
      <div className={cn(
        "relative h-32",
        "bg-gradient-to-r from-blue-400 to-blue-600"
      )}>
        <div className="absolute -bottom-12 left-4">
          <Avatar className={cn("h-24 w-24 border-4 border-background")}>
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback className={cn("text-lg")}>
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <CardContent className={cn("pt-14")}>
        <div className={cn("flex justify-between items-start mb-4")}>
          <div className={cn("space-y-1")}>
            <h1 className={cn("text-2xl font-bold leading-tight")}>
              {user.name}
              {user.userProfile?.username && (
                <span className={cn("text-muted-foreground font-normal ml-2")}>
                  @{user.userProfile.username}
                </span>
              )}
            </h1>
          </div>

          {isOwnProfile && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings" className={cn("flex items-center")}>
                <Pencil className={cn("h-4 w-4 mr-2")} />
                Edit profile
              </Link>
            </Button>
          )}
        </div>

        {/* Bio Section */}
        {user.userProfile?.bio && (
          <div className={cn("mt-4 text-muted-foreground")}>
            <p className={cn("whitespace-pre-wrap")}>{user.userProfile.bio}</p>
          </div>
        )}

        {/* Stats Section */}
        <div className={cn("mt-4 flex items-center gap-4 text-sm text-muted-foreground")}>
          <div className={cn("flex items-center gap-1")}>
            <span className={cn("font-semibold text-foreground")}>0</span> Following
          </div>
          <div className={cn("flex items-center gap-1")}>
            <span className={cn("font-semibold text-foreground")}>0</span> Followers
          </div>
        </div>
      </CardContent>
    </Card>
  );
}