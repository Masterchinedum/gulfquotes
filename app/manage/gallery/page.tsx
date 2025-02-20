"use client";

import { GalleryUpload } from "@/components/gallery/GalleryUpload";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import type { CreateGalleryInput } from "@/schemas/gallery";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function GalleryPage() {
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Handle new image upload
  const handleUploadComplete = async (data: CreateGalleryInput) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save image');
      }
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });

      // Refresh the grid by resetting to page 1
      setPage(1);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save image",
        variant: "destructive"
      });
    }
  };

  // Handle errors from grid
  const handleError = (message: string) => {
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Gallery Management</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage images for your quotes
        </p>
      </div>
      
      <GalleryUpload 
        onUploadComplete={handleUploadComplete}
      />

      <GalleryGrid 
        searchQuery=""
        currentPage={page}
        onPageChange={handlePageChange}
        onError={handleError}
      />

      {error && (
        <div className="text-sm text-destructive text-center">
          {error}
        </div>
      )}
    </div>
  );
}