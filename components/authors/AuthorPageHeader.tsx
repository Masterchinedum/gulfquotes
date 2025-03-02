// components/authors/AuthorPageHeader.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Author } from "@/types/author";
import { AuthorFollowButton } from "@/app/(general)/authors/components/author-follow-button";
import { Book, Users } from "lucide-react";
import { formatLifespan } from "@/lib/utils/author-profile";

interface AuthorPageHeaderProps {
  author: Author & {
    totalQuotes: number;
  };
  className?: string;
}

export function AuthorPageHeader({ author, className }: AuthorPageHeaderProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Author Avatar */}
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            <AvatarImage src={author.image || ""} alt={author.name} />
            <AvatarFallback className="text-2xl">{author.name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-4">
            {/* Author Name and Follow Button */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">{author.name}</h1>
                {(author.born || author.died) && (
                  <p className="text-muted-foreground">
                    {formatLifespan(author.born, author.died)}
                  </p>
                )}
              </div>
              
              <AuthorFollowButton
                authorSlug={author.slug}
                initialFollowers={author.followers}
                initialFollowed={author.isFollowed}
                showCount={true}
              />
            </div>
            
            {/* Author Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{author.quoteCount} quotes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{author.followers} followers</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}