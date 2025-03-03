// app/manage/email-dashboard/components/EmailStats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface EmailStatsProps {
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    delayed: number;
  };
  isLoading: boolean;
}

export function EmailStats({ stats, isLoading }: EmailStatsProps) {
  // Calculate percentages with safeguards against division by zero
  const deliveryRate = stats.sent ? Math.round((stats.delivered / stats.sent) * 100) : 0;
  const openRate = stats.delivered ? Math.round((stats.opened / stats.delivered) * 100) : 0;
  const clickRate = stats.opened ? Math.round((stats.clicked / stats.opened) * 100) : 0;
  const bounceRate = stats.sent ? Math.round((stats.bounced / stats.sent) * 100) : 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Total Sent" 
        value={stats.sent.toString()} 
        description="Total emails sent"
        isLoading={isLoading} 
      />
      <StatCard 
        title="Delivery Rate" 
        value={`${deliveryRate}%`}
        description={`${stats.delivered} delivered out of ${stats.sent} sent`}
        isLoading={isLoading} 
        color={deliveryRate > 95 ? "text-green-600" : deliveryRate > 85 ? "text-yellow-600" : "text-red-600"}
      />
      <StatCard 
        title="Open Rate" 
        value={`${openRate}%`} 
        description={`${stats.opened} opened out of ${stats.delivered} delivered`}
        isLoading={isLoading} 
      />
      <StatCard 
        title="Click Rate" 
        value={`${clickRate}%`}
        description={`${stats.clicked} clicked out of ${stats.opened} opened`}
        isLoading={isLoading} 
      />
      <StatCard 
        title="Bounces" 
        value={stats.bounced.toString()} 
        description={`${bounceRate}% bounce rate`}
        isLoading={isLoading} 
        color={bounceRate < 2 ? "text-green-600" : bounceRate < 5 ? "text-yellow-600" : "text-red-600"}
      />
      <StatCard 
        title="Complaints" 
        value={stats.complained.toString()}
        description="Spam reports received"
        isLoading={isLoading} 
        color={stats.complained === 0 ? "text-green-600" : "text-red-600"}
      />
      <StatCard 
        title="Delayed" 
        value={stats.delayed.toString()}
        description="Emails with delivery delays"
        isLoading={isLoading} 
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  isLoading: boolean;
  color?: string;
}

function StatCard({ title, value, description, isLoading, color = "text-foreground" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}