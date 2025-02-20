"use client";

import { GalleryUpload } from "@/components/gallery/GalleryUpload";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import type { CreateGalleryInput } from "@/schemas/gallery";
import type { GalleryApiError, GalleryItem, GalleryListResponse } from "@/types/gallery";
// import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function GalleryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Gallery images query
  const { data, isLoading, error } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      const response = await fetch('/api/gallery');
      if (!response.ok) throw new Error('Failed to fetch images');
      return response.json();
    }
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        const apiError = error.error as GalleryApiError;
        throw new Error(apiError.message || 'Failed to delete image');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['gallery-images'] });

      // Snapshot the previous value
      const previousImages = queryClient.getQueryData(['gallery-images']);

      // Optimistically update to the new value
      queryClient.setQueryData(['gallery-images'], (old: GalleryListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((item: GalleryItem) => item.id !== deletedId)
          }
        };
      });

      return { previousImages };
    },
    onError: (err, variables, context) => {
      // Restore previous data on error
      queryClient.setQueryData(['gallery-images'], context?.previousImages);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete image",
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: CreateGalleryInput) => {
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
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
      // Refetch images to show the new upload
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save image",
        variant: "destructive"
      });
    }
  });

  // Handle delete
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  // Handle upload
  const handleUploadComplete = async (data: CreateGalleryInput) => {
    await uploadMutation.mutateAsync(data);
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
        disabled={uploadMutation.isPending}
      />

      <GalleryGrid 
        items={data?.data?.items ?? []}
        isLoading={isLoading}
        onDelete={handleDelete}
        error={error instanceof Error ? error.message : undefined}
      />
    </div>
  );
}