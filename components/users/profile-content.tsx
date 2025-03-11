"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  BookmarkIcon, 
  HeartIcon, 
  UsersIcon, 
  ClockIcon, 
  CalendarIcon 
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { UserData } from "@/types/api/users";
import { UserQuoteList } from "./user-quote-list"; // Import our new component

interface ProfileContentProps {
  user: UserData;
}

export function ProfileContent({ user }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState("activity");
  const isCurrentUser = user.isCurrentUser;
  
  // Access real data from the user object
  const {
    likes = [],
    bookmarks = [],
    followedAuthors = [],
    activityStats
  } = user.userProfile || {};
  
  // Format membership date
  const memberSince = activityStats?.memberSince 
    ? new Date(activityStats.memberSince)
    : null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
            <TabsTrigger
              value="activity"
              className={cn(
                "rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                <span>Activity</span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="likes"
              className={cn(
                "rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <HeartIcon className="h-4 w-4" />
                <span>Likes</span>
                <Badge variant="secondary" className="ml-1">
                  {activityStats?.likeCount || 0}
                </Badge>
              </div>
            </TabsTrigger>

            {isCurrentUser && (
              <TabsTrigger
                value="bookmarks"
                className={cn(
                  "rounded-none border-b-2 border-transparent",
                  "data-[state=active]:border-primary"
                )}
              >
                <div className="flex items-center gap-2">
                  <BookmarkIcon className="h-4 w-4" />
                  <span>Bookmarks</span>
                  <Badge variant="secondary" className="ml-1">
                    {activityStats?.bookmarkCount || 0}
                  </Badge>
                </div>
              </TabsTrigger>
            )}

            <TabsTrigger
              value="following"
              className={cn(
                "rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                <span>Following</span>
                <Badge variant="secondary" className="ml-1">
                  {activityStats?.followingCount || 0}
                </Badge>
              </div>
            </TabsTrigger>
          </TabsList>
          
          {/* Activity Tab */}
          <TabsContent value="activity" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                {memberSince && (
                  <CardDescription className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Member since {formatDate(memberSince.toString())}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Activity summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center">
                    <HeartIcon className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="font-semibold text-lg">{activityStats?.likeCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Liked Quotes</p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center">
                    <BookmarkIcon className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="font-semibold text-lg">{activityStats?.bookmarkCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Bookmarked Quotes</p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center">
                    <UsersIcon className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="font-semibold text-lg">{activityStats?.followingCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                </div>

                {/* Recent activity timeline */}
                <div className="mt-6">
                  {(followedAuthors.length > 0 || likes.length > 0) ? (
                    <div className="space-y-4">
                      {followedAuthors.length > 0 && (
                        <div className="border-l-2 border-muted pl-4 py-2">
                          <p className="text-sm text-muted-foreground">
                            Started following {followedAuthors.length} author{followedAuthors.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                      {likes.length > 0 && (
                        <div className="border-l-2 border-muted pl-4 py-2">
                          <p className="text-sm text-muted-foreground">
                            Liked {likes.length} quote{likes.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No recent activity to display
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Likes Tab - Using our new UserQuoteList component */}
          <TabsContent value="likes" className="py-4">
            <UserQuoteList
              quotes={likes}
              title="Liked Quotes"
              emptyMessage="No quotes have been liked yet."
              viewAllLink={likes.length > 5 ? `/users/${user.userProfile?.slug || user.id}/likes` : undefined}
              viewAllText="View All Liked Quotes"
            />
          </TabsContent>

          {/* Bookmarks Tab - Only visible to profile owner, also using UserQuoteList */}
          {isCurrentUser && (
            <TabsContent value="bookmarks" className="py-4">
              <UserQuoteList
                quotes={bookmarks}
                title="Bookmarked Quotes"
                emptyMessage={
                  <>
                    No quotes have been bookmarked yet.
                    <div className="mt-4">
                      <Link href="/quotes">
                        <Button variant="outline" size="sm">Browse Quotes</Button>
                      </Link>
                    </div>
                  </>
                }
                viewAllLink={bookmarks.length > 5 ? `/users/${user.userProfile?.slug || user.id}/bookmarks` : undefined}
                viewAllText="View All Bookmarks"
              />
            </TabsContent>
          )}

          {/* Following Tab */}
          <TabsContent value="following" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {followedAuthors.length > 0 
                    ? `Following ${followedAuthors.length} Authors`
                    : "Not Following Any Authors"}
                </CardTitle>
              </CardHeader>
              {followedAuthors.length > 0 ? (
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {followedAuthors.map((author) => (
                    <div key={author.id} className="flex items-center gap-3 border rounded-lg p-3">
                      <Avatar>
                        <AvatarImage src={author.image || ""} alt={author.name} />
                        <AvatarFallback>{author.name[0] || "A"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link href={`/authors/${author.slug}`} className="block font-medium hover:underline truncate">
                          {author.name}
                        </Link>
                        {author.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{author.bio}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {followedAuthors.length > 6 && (
                    <div className="col-span-2 text-center pt-2">
                      <Link href={`/users/${user.userProfile?.slug || user.id}/following`}>
                        <Button variant="outline" size="sm">View All Following</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent className="text-center py-8 text-muted-foreground">
                  Not following any authors yet.
                  <div className="mt-4">
                    <Link href="/authors">
                      <Button variant="outline" size="sm">Browse Authors</Button>
                    </Link>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}