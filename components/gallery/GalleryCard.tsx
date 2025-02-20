"use client";

import { CldImage } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { GalleryItem } from "@/types/gallery";
import { useState } from "react";

interface GalleryCardProps {
  item: GalleryItem;
  onDelete?: (id: string) => Promise<void>;
  disabled?: boolean;
}

export function GalleryCard({
  item,
  onDelete,
  disabled = false
}: GalleryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative aspect-[1.91/1] overflow-hidden rounded-lg border",
        "transition-all hover:opacity-90",
        disabled && "opacity-50 cursor-not-allowed",
        isDeleting && "animate-pulse"
      )}
    >
      {/* Image */}
      <CldImage
        src={item.publicId}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        alt={item.altText || "Gallery image"}
        className="object-cover"
      />

      {/* Loading Indicator */}
      {isDeleting && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Hover Actions */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {onDelete && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={disabled || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Image</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this image? This action cannot be undone 
                        and will remove the image from any quotes using it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete image permanently</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Metadata Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs truncate">{item.title || "Untitled"}</p>
        <p className="text-xs text-gray-300">Used: {item._count?.quotes || 0} times</p>
      </div>
    </div>
  );
}