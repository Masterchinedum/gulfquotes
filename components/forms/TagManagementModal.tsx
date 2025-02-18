import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagManagement } from "@/components/tags/tag-management";

interface TagManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TagManagementModal({
  open,
  onOpenChange,
  onSuccess,
}: TagManagementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Create and manage tags for your quotes
          </DialogDescription>
        </DialogHeader>
        <TagManagement onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}