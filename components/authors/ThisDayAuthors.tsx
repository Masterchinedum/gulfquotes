"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import { getTodaysDate, getMonthName } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  image?: string | null;
  born?: string | null;
  bornYear?: number | null;
}

export function ThisDayAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get today's date
  const today = getTodaysDate();
  const formattedDate = `${getMonthName(today.month, true)} ${today.day}`;
  
  useEffect(() => {
    async function fetchTodaysAuthors() {
      try {
        setLoading(true);
        const response = await fetch(`/api/birthdays/${today.month}_${today.day}?limit=4`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error.message);
        } else if (data.data) {
          setAuthors(data.data.authors.items);
        }
      } catch (err) {
        console.error("Failed to fetch today's birthdays:", err);
        setError("Failed to load authors born today");
      } finally {
        setLoading(false);
      }
    }
    
    fetchTodaysAuthors();
  }, [today.day, today.month]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Born Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Born Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (authors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Born Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No known authors were born on {formattedDate}.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>Born on {formattedDate}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {authors.map(author => (
          <div key={author.id} className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {author.image ? (
                <AvatarImage src={author.image} alt={author.name} />
              ) : null}
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Link 
                href={`/authors/${author.slug}`} 
                className="font-medium text-sm hover:underline"
              >
                {author.name}
              </Link>
              {author.bornYear && (
                <p className="text-xs text-muted-foreground">
                  Born {author.bornYear}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Link href={`/birthdays/${getMonthName(today.month).toLowerCase()}_${today.day}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View All
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}