// components/quotes/category-list.tsx
"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
}

export function CategoryList({ categories, onEdit }: CategoryListProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setIsLoading(categoryId);
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to delete category");
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      // Refresh the page or update the list
      window.location.reload();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No categories found
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{formatDate(category.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(category)}
                    >
                      <Icons.edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      disabled={isLoading === category.id}
                    >
                      {isLoading === category.id ? (
                        <Icons.spinner className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icons.trash className="h-4 w-4 text-destructive" />
                      )}
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}