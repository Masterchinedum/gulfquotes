// app/manage/email-dashboard/components/RecentEmailsList.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUpDown, Info } from "lucide-react";
import { EmailEventType, EmailEvent, EmailTag } from "@/lib/services/tracking/email-tracking.service";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RecentEmailsListProps {
  events: EmailEvent[];
  isLoading: boolean;
  selectedType: EmailEventType | "all";
  onTypeChange: (type: EmailEventType | "all") => void;
}

export function RecentEmailsList({ 
  events, 
  isLoading,
  selectedType,
  onTypeChange
}: RecentEmailsListProps) {
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Filter events by selected type
  const filteredEvents = selectedType === "all" 
    ? events 
    : events.filter(event => event.type === selectedType);
  
  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
  });
  
  const toggleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };
  
  // Get badge color based on event type
  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "success" | "outline" => {
    switch (type) {
      case EmailEventType.SENT:
        return "default";
      case EmailEventType.DELIVERED:
        return "success";
      case EmailEventType.OPENED:
        return "success";
      case EmailEventType.CLICKED:
        return "success";
      case EmailEventType.BOUNCED:
        return "destructive";
      case EmailEventType.COMPLAINED:
        return "destructive";
      case EmailEventType.DELIVERY_DELAYED:
        return "secondary"; 
      default:
        return "secondary";
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="w-full sm:w-[180px]">
          <Select
            value={selectedType}
            onValueChange={(value) => onTypeChange(value as EmailEventType | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value={EmailEventType.SENT}>Sent</SelectItem>
              <SelectItem value={EmailEventType.DELIVERED}>Delivered</SelectItem>
              <SelectItem value={EmailEventType.OPENED}>Opened</SelectItem>
              <SelectItem value={EmailEventType.CLICKED}>Clicked</SelectItem>
              <SelectItem value={EmailEventType.BOUNCED}>Bounced</SelectItem>
              <SelectItem value={EmailEventType.COMPLAINED}>Complained</SelectItem>
              <SelectItem value={EmailEventType.DELIVERY_DELAYED}>Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full sm:w-auto"
          onClick={toggleSort}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {sortDirection === "desc" ? "Newest First" : "Oldest First"}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sortedEvents.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No email events found.
        </p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant={getBadgeVariant(event.type)}>
                      {event.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.data.email}</TableCell>
                  <TableCell>
                    {format(new Date(event.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Email Event Details</DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-3 items-center gap-4">
                            <span className="font-medium">ID:</span>
                            <span className="col-span-2 font-mono text-sm">{event.id}</span>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <span className="font-medium">Type:</span>
                            <span className="col-span-2">
                              <Badge variant={getBadgeVariant(event.type)}>{event.type}</Badge>
                            </span>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <span className="font-medium">Email:</span>
                            <span className="col-span-2">{event.data.email}</span>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <span className="font-medium">Time:</span>
                            <span className="col-span-2">
                              {format(new Date(event.createdAt), "MMM d, yyyy h:mm:ss a")}
                            </span>
                          </div>
                          
                          {event.data.subject && (
                            <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium">Subject:</span>
                              <span className="col-span-2">{event.data.subject}</span>
                            </div>
                          )}
                          
                          {event.data.userId && (
                            <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium">User ID:</span>
                              <span className="col-span-2 font-mono text-sm">{event.data.userId}</span>
                            </div>
                          )}
                          
                          {!!event.data.error && (
                            <div className="grid grid-cols-3 items-center gap-4">
                              <span className="font-medium">Error:</span>
                              <span className="col-span-2 text-red-500">
                                {typeof event.data.error === 'string' 
                                  ? event.data.error 
                                  : JSON.stringify(event.data.error)}
                              </span>
                            </div>
                          )}
                          
                          {event.data.tags && event.data.tags.length > 0 && (
                            <div className="grid grid-cols-3 items-start gap-4">
                              <span className="font-medium">Tags:</span>
                              <div className="col-span-2 flex flex-wrap gap-1">
                                {event.data.tags.map((tag: EmailTag, index: number) => (
                                  <Badge key={index} variant="outline">
                                    {tag.name}: {tag.value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}