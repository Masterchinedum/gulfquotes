// components/authors/AuthorBioSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseInfluences } from "@/lib/utils/author-profile";
import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";

interface AuthorBioSectionProps {
  bio: string | null;
  influences?: string | null;
  className?: string;
}

export function AuthorBioSection({ bio, influences, className }: AuthorBioSectionProps) {
  // Parse influences into an array
  const influencesList = parseInfluences(influences);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>About the Author</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Biography */}
        {bio ? (
          <div className="prose prose-quotation max-w-none">
            <p className="whitespace-pre-wrap">{bio}</p>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No biography available.</p>
        )}
        
        {/* Influences */}
        {influencesList.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Influences</h3>
            <div className="flex flex-wrap gap-2">
              {influencesList.map((influence, index) => (
                <Badge key={index} variant="outline" className="bg-muted/50">
                  {influence}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}