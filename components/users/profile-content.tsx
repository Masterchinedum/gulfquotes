import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { UserData } from "@/types/api/users";

interface ProfileContentProps {
  user: UserData;
}

export function ProfileContent({ user }: ProfileContentProps) {
  // Dummy data for quotes if userProfile.quotes is not available
  const dummyQuotes = user.userProfile?.quotes || [
    { id: "1", content: "This is a dummy quote." },
    { id: "2", content: "Another dummy quote." },
  ];

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0">
        <Tabs defaultValue="quotes" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
            <TabsTrigger
              value="quotes"
              className={cn(
                "rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <span>Quotes</span>
                <span className="text-sm text-muted-foreground">
                  {dummyQuotes.length}
                </span>
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
                <span>Likes</span>
                <span className="text-sm text-muted-foreground">
                  {user.userProfile?.likes?.length || 0}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quotes" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {dummyQuotes.length 
                    ? `${dummyQuotes.length} Quotes`
                    : "No quotes yet"}
                </CardTitle>
              </CardHeader>
              {dummyQuotes.length ? (
                <CardContent className="grid gap-4">
                  {dummyQuotes.map((quote) => (
                    <div key={quote.id} className="p-4 border rounded">
                      {quote.content}
                    </div>
                  ))}
                </CardContent>
              ) : (
                <CardContent className="text-muted-foreground text-center py-8">
                  No quotes have been added yet.
                </CardContent>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="likes" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {user.userProfile?.likes?.length 
                    ? `${user.userProfile.likes.length} Liked Quotes`
                    : "No likes yet"}
                </CardTitle>
              </CardHeader>
              {user.userProfile?.likes?.length ? (
                <CardContent className="grid gap-4">
                  {/* Liked quote items will be rendered here */}
                </CardContent>
              ) : (
                <CardContent className="text-muted-foreground text-center py-8">
                  No quotes have been liked yet.
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}