// app/manage/email-dashboard/components/EmailSearch.tsx
"use client";

import { useState } from "react";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { RecentEmailsList } from "./RecentEmailsList";
import { EmailEvent, EmailEventType } from "@/lib/services/tracking/email-tracking.service";

export function EmailSearch() {
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<EmailEvent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedType, setSelectedType] = useState<EmailEventType | "all">("all");
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`/api/admin/email-tracking/search?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error("Failed to search email events");
      }
      
      const data = await response.json();
      setSearchResults(data.events || []);
    } catch (error) {
      console.error("Error searching emails:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Email Events</CardTitle>
        <CardDescription>
          Search for email events by recipient email address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Enter recipient email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !email.trim()}>
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </form>
        
        {hasSearched && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Search Results</h3>
            
            <RecentEmailsList
              events={searchResults}
              isLoading={isSearching}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
            />
            
            {!isSearching && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No email events found for &quot;{email}&quot;
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}