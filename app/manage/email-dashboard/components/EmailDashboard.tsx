// app/manage/email-dashboard/components/EmailDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailStats } from "./EmailStats";
import { RecentEmailsList } from "./RecentEmailsList";
import { EmailSearch } from "./EmailSearch";
import { EmailEventType, EmailEvent } from "@/lib/services/tracking/email-tracking.service";

export function EmailDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    delayed: number;
  }>({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    delayed: 0,
  });
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [selectedType, setSelectedType] = useState<EmailEventType | "all">("all");
  
  // Fetch stats and recent events
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/email-tracking");
        if (!response.ok) {
          throw new Error("Failed to fetch email tracking data");
        }
        
        const data = await response.json();
        setStats(data.stats);
        setEvents(data.events);
      } catch (error) {
        console.error("Error fetching email data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
    
    // Refresh data every minute
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <EmailStats stats={stats} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Events</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentEmailsList 
                events={events} 
                isLoading={isLoading} 
                selectedType={selectedType}
                onTypeChange={setSelectedType}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search" className="space-y-4">
          <EmailSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}