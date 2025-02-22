// app/manage/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Icons } from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryList } from "@/components/quotes/category-list";
import { CategoryForm } from "@/components/quotes/category-form";
import { CategoryManagementModal } from "@/components/quotes/category-management-modal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleModalClose = () => {
    setSelectedCategory(null);
    fetchCategories(); // Refresh the list after edit
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchCategories(); // Refresh the list after creation
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your categories and their slugs
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* List View */}
      <CategoryList 
        categories={categories} 
        onEdit={handleEdit}
      />

      {/* Edit Modal */}
      <CategoryManagementModal
        open={selectedCategory !== null}
        onOpenChange={() => setSelectedCategory(null)}
        category={selectedCategory}
        onSuccess={handleModalClose}
      />

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>
              Create a new category with an optional custom slug
            </DialogDescription>
          </DialogHeader>
          <CategoryForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}