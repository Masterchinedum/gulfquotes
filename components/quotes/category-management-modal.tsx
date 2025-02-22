// components/quotes/category-management-modal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Category } from "@prisma/client";
import { CategoryEditForm } from "./category-edit-form";

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSuccess?: () => void;
}

export function CategoryManagementModal({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryManagementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Update the category details below"
              : "Create a new category"}
          </DialogDescription>
        </DialogHeader>
        {category && (
          <CategoryEditForm category={category} onSuccess={onSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}