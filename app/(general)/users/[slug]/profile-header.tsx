"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Pencil, Bookmark, Heart, Users, MessageSquare } from "lucide-react";
import type { UserData } from "@/types/api/users";

interface ProfileHeaderProps {
  user: UserData;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === user.id;
  
  // Get stats from user data
  const stats = user.userProfile?.activityStats || {
    likeCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    followingCount: 0,
    memberSince: ""
  };

  return (
    <Card className="border-none shadow-none">
      {/* Cover Image Area */}
      <div className={cn(
        "relative h-32",
        "bg-gradient-to-r from-blue-500 to-purple-500"
      )}>
        {/* Avatar */}
        <div className="absolute -bottom-12 left-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <CardContent className="pt-14 space-y-4">
        {/* Profile Info */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              {user.name || "Anonymous"}
              {user.userProfile?.username && (
                <span className="text-muted-foreground font-normal ml-2">
                  @{user.userProfile.username}
                </span>
              )}
            </h1>
          </div>

          {/* Edit Button */}
          {isOwnProfile && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/users/settings" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit profile
              </Link>
            </Button>
          )}
        </div>

        {/* Bio */}
        <div className="text-muted-foreground">
          {user.userProfile?.bio ? (
            <p className="whitespace-pre-wrap">{user.userProfile.bio}</p>
          ) : (
            <p className="italic">No bio provided</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 pt-4 border-t">
          <Link href={`/users/${user.userProfile?.slug || user.id}/following`} className="flex items-center gap-1 hover:text-primary transition-colors">
            <Users className="h-4 w-4" />
            <span className="font-semibold">{stats.followingCount}</span>
            <span className="text-muted-foreground">Following</span>
          </Link>
          
          {isOwnProfile && (
            <>
              <Link href={`/users/${user.userProfile?.slug || user.id}/likes`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Heart className="h-4 w-4" />
                <span className="font-semibold">{stats.likeCount}</span>
                <span className="text-muted-foreground">Likes</span>
              </Link>
              
              <Link href={`/users/${user.userProfile?.slug || user.id}/bookmarks`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Bookmark className="h-4 w-4" />
                <span className="font-semibold">{stats.bookmarkCount}</span>
                <span className="text-muted-foreground">Bookmarks</span>
              </Link>
              
              <Link href={`/users/${user.userProfile?.slug || user.id}/comments`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span className="font-semibold">{stats.commentCount}</span>
                <span className="text-muted-foreground">Comments</span>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}