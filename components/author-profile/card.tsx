import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type AuthorProfile } from "@/lib/auth/author-profile";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AuthorProfileCardProps {
  author: AuthorProfile;
  className?: string;
}

export function AuthorProfileCard({ author, className }: AuthorProfileCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={author.images?.profile} alt={author.name} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{author.name}</h2>
          <p className="text-sm text-muted-foreground">
            {author.born && `Born: ${author.born}`}
            {author.died && ` • Died: ${author.died}`}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {author.influences && (
          <div>
            <h3 className="font-semibold">Influences</h3>
            <p className="text-sm text-muted-foreground">{author.influences}</p>
          </div>
        )}
        <div>
          <h3 className="font-semibold">Biography</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {author.bio}
          </p>
        </div>
        {author.images?.gallery && author.images.gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {author.images.gallery.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`${author.name} gallery image ${index + 1}`}
                width={300}
                height={300}
                className="rounded-md object-cover aspect-square"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}