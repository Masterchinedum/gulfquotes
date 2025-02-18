"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@prisma/client";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createTagSchema } from "@/schemas/tag";

interface TagManagementProps {
  onSuccess?: () => void;  // Callback to refresh parent component
}

export function TagManagement({ onSuccess }: TagManagementProps) {
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (!response.ok) throw new Error("Failed to fetch tags");
      const data = await response.json();
      setTags(data.data.items);
    } catch (error) {
      toast.error("Failed to load tags");
    }
  };

  // Create tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Validate input
      const validatedData = createTagSchema.parse({ name: newTagName });
      
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: validatedData.name }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);

      toast.success("Tag created successfully");
      setNewTagName("");
      fetchTags();
      if (onSuccess) onSuccess();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tag");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete tag
  const handleDeleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
      }

      toast.success("Tag deleted successfully");
      fetchTags();
      if (onSuccess) onSuccess();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tag");
    }
  };

  // Load tags on mount
  useState(() => {
    fetchTags();
  }, []);

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateTag} className="flex gap-2">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Enter new tag name"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Create Tag
        </Button>
      </form>

      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="group">
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteTag(tag.id)}
              >
                <Icons.close className="h-3 w-3" />
                <span className="sr-only">Delete tag</span>
              </Button>
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}