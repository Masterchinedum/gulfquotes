// File: app/manage/author-profiles/components/delete-dialog.tsx

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  import { Button } from "@/components/ui/button";
  import { useState } from "react";
  import { useRouter } from "next/navigation";
  
  interface DeleteDialogProps {
    authorId: string;
    authorName: string;
    onSuccess?: () => void;
  }
  
  export function DeleteDialog({ authorId, authorName, onSuccess }: DeleteDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
  
    async function onDelete() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/author-profiles/${authorId}`, {
          method: "DELETE",
        });
  
        if (!response.ok) {
          throw new Error("Failed to delete author profile");
        }
  
        setOpen(false);
        router.refresh();
        onSuccess?.();
      } catch (error) {
        console.error("Error deleting author profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
  
    return (
      <>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Delete
        </Button>
  
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {authorName}&apos;s profile and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }