"use client";

import { useState, useMemo } from "react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
} from "@/components/ui/card";
import { 
  Heart, 
  MessageSquare, 
  Users, 
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ProfileQuote, ProfileComment, ProfileFollowedAuthor, UserData} from "@/types/api/users";

// Activity type definitions
type ActivityType = 'like' | 'comment' | 'follow' | 'all';

interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  content: {
    quote?: ProfileQuote;
    comment?: ProfileComment;
    author?: ProfileFollowedAuthor;
  };
}

interface ActivityGroup {
  label: string;
  activities: Activity[];
}

interface ActivityFeedProps {
  user: UserData;
  initialFilter?: ActivityType;
  limit?: number;
}

export function ActivityFeed({ 
  user, 
  initialFilter = 'all', 
  limit = 10
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityType>(initialFilter);
  const [expanded, setExpanded] = useState(false);

  // Extract data from user
  const {
    likes = [],
    comments = [],
    followedAuthors = [],
  } = user.userProfile || {};
  
  // Fix: Wrap privacySettings in its own useMemo to avoid recreating on every render
  const privacySettings = useMemo(() => {
    return user.userProfile?.privacySettings || {
      showLikes: true,
      showBookmarks: user.isCurrentUser || false,
      showFollowing: true,
    };
  }, [user.userProfile?.privacySettings, user.isCurrentUser]);

  // Generate activities array based on available data and privacy settings
  const activities = useMemo(() => {
    let allActivities: Activity[] = [];
    
    // Add likes if visible
    if (privacySettings.showLikes) {
      const likeActivities = likes.map(quote => ({
        id: `like-${quote.id}`,
        type: 'like' as ActivityType,
        timestamp: quote.createdAt,
        content: { quote }
      }));
      allActivities = [...allActivities, ...likeActivities];
    }
    
    // Add comments (always visible)
    const commentActivities = comments.map(comment => ({
      id: `comment-${comment.id}`,
      type: 'comment' as ActivityType,
      timestamp: comment.createdAt,
      content: { comment }
    }));
    allActivities = [...allActivities, ...commentActivities];
    
    // Add follows if visible
    if (privacySettings.showFollowing) {
      const followActivities = followedAuthors.map(author => ({
        id: `follow-${author.id}`,
        type: 'follow' as ActivityType,
        timestamp: author.createdAt,
        content: { author }
      }));
      allActivities = [...allActivities, ...followActivities];
    }
    
    // Filter activities based on selected type
    if (filter !== 'all') {
      allActivities = allActivities.filter(activity => activity.type === filter);
    }
    
    // Sort activities by timestamp (newest first)
    return allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [likes, comments, followedAuthors, filter, privacySettings]);
  
  // Group activities by time period
  const groupedActivities = useMemo(() => {
    const groups: ActivityGroup[] = [
      { label: 'Today', activities: [] },
      { label: 'Yesterday', activities: [] },
      { label: 'This Week', activities: [] },
      { label: 'Earlier', activities: [] },
    ];
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      
      if (isToday(date)) {
        groups[0].activities.push(activity);
      } else if (isYesterday(date)) {
        groups[1].activities.push(activity);
      } else if (isThisWeek(date)) {
        groups[2].activities.push(activity);
      } else {
        groups[3].activities.push(activity);
      }
    });
    
    // Remove empty groups
    return groups.filter(group => group.activities.length > 0);
  }, [activities]);
  
  // Get visible activities based on limit and expanded state
  const visibleActivities = useMemo(() => {
    if (expanded) return groupedActivities;
    
    // If not expanded, limit the total number of activities
    let count = 0;
    const limitedGroups: ActivityGroup[] = [];
    
    for (const group of groupedActivities) {
      if (count >= limit) break;
      
      const remainingItems = limit - count;
      if (group.activities.length <= remainingItems) {
        // Add whole group if it fits
        limitedGroups.push(group);
        count += group.activities.length;
      } else {
        // Add partial group if it doesn't fit
        limitedGroups.push({
          label: group.label,
          activities: group.activities.slice(0, remainingItems)
        });
        count += remainingItems;
        break;
      }
    }
    
    return limitedGroups;
  }, [groupedActivities, limit, expanded]);
  
  // Calculate total activity count
  const totalActivityCount = activities.length;
  
  // Format date for display
  const formatActivityDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return format(date, "h:mm a");
      }
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };
  
  // Get icon and color for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-rose-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <Users className="h-4 w-4 text-emerald-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get activity type counts
  const activityCounts = useMemo(() => {
    return {
      like: activities.filter(a => a.type === 'like').length,
      comment: activities.filter(a => a.type === 'comment').length,
      follow: activities.filter(a => a.type === 'follow').length,
      all: activities.length
    };
  }, [activities]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Activity Feed
          </CardTitle>
          
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as ActivityType)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Activities ({activityCounts.all})
              </SelectItem>
              <SelectItem value="like" disabled={!privacySettings.showLikes}>
                Likes ({activityCounts.like})
              </SelectItem>
              <SelectItem value="comment">
                Comments ({activityCounts.comment})
              </SelectItem>
              <SelectItem value="follow" disabled={!privacySettings.showFollowing}>
                Follows ({activityCounts.follow})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {visibleActivities.length > 0 ? (
          <>
            {visibleActivities.map((group) => (
              <div key={group.label} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {group.label}
                </h3>
                {group.activities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="border-l-2 pl-4 py-2 hover:border-primary transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        <span className="text-sm font-medium">
                          {activity.type === 'like' && 'Liked a quote'}
                          {activity.type === 'comment' && 'Left a comment'}
                          {activity.type === 'follow' && 'Followed an author'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatActivityDate(activity.timestamp)}
                      </span>
                    </div>
                    
                    {/* Activity details */}
                    {activity.type === 'like' && activity.content.quote && (
                      <Link 
                        href={`/quotes/${activity.content.quote.slug}`}
                        className="mt-2 block p-3 bg-muted/40 rounded-md hover:bg-muted"
                      >
                        <p className="text-sm line-clamp-2">
                          &quot;{activity.content.quote.content}&quot;
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            by {activity.content.quote.authorProfile.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.content.quote.category.name}
                          </Badge>
                        </div>
                      </Link>
                    )}
                    
                    {activity.type === 'comment' && activity.content.comment && (
                      <div className="mt-2">
                        <Link 
                          href={`/quotes/${activity.content.comment.quote.slug}`}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          On &quot;{activity.content.comment.quote.content.substring(0, 50)}...&quot;
                        </Link>
                        <div className="mt-1 p-3 bg-muted/40 rounded-md">
                          <p className="text-sm line-clamp-2">
                            {activity.content.comment.content}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {activity.type === 'follow' && activity.content.author && (
                      <Link
                        href={`/authors/${activity.content.author.slug}`}
                        className="mt-2 flex items-center gap-3 p-3 bg-muted/40 rounded-md hover:bg-muted"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={activity.content.author.image || ""} 
                            alt={activity.content.author.name}
                          />
                          <AvatarFallback>
                            {activity.content.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {activity.content.author.name}
                          </p>
                          {activity.content.author.bio && (
                            <p className="text-xs text-muted-foreground truncate">
                              {activity.content.author.bio}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Show more/less button */}
            {totalActivityCount > limit && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show More ({totalActivityCount - limit} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No {filter !== 'all' ? filter : ''} activity to display</p>
            
            {filter !== 'all' && (
              <Button
                variant="ghost"
                size="sm" 
                onClick={() => setFilter('all')}
                className="mt-2"
              >
                Show all activity types
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}