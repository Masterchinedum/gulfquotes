"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { createTag, searchTags } from "@/actions/tag";
import { toast } from "sonner";
import { Tag } from "@prisma/client";
import { useDebouncedCallback } from "use-debounce";
import { Command as CommandPrimitive } from "cmdk";

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  disabled?: boolean;
  maxTags?: number;
}

export function TagInput({ 
  selectedTags, 
  onTagsChange, 
  disabled = false,
  maxTags = 10 
}: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const searchTagsDebounced = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setTags([]);
      return;
    }

    try {
      setLoading(true);
      const result = await searchTags({ 
        search: query,
        page: 1,
        limit: 10
      });
      if (result) {
        setTags(result.items);
      }
    } catch (error) {
      setTags([]); // Clear tags on error
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to search tags"
      );
    } finally {
      setLoading(false);
    }
  }, 300);

  // Handle tag selection
  const handleSelect = async (tagName: string) => {
    // Check if we've reached the maximum number of tags
    if (selectedTags.length >= maxTags) {
      toast.error(`Maximum ${maxTags} tags allowed`);
      return;
    }

    try {
      // If the tagName doesn't match any existing tag, create a new one
      let tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      
      if (!tag) {
        tag = await createTag(tagName);
        if (!tag) throw new Error("Failed to create tag");
      }

      // Check if tag is already selected
      if (selectedTags.some(t => t.id === tag!.id)) {
        toast.error("Tag already added");
        return;
      }

      // Add the tag to selected tags
      onTagsChange([...selectedTags, tag]);
      setSearchQuery("");
      setOpen(false);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add tag");
    }
  };

  // Handle tag removal
  const handleRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  // Handle search input change
  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
    searchTagsDebounced(search);
  }, [searchTagsDebounced]);

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || selectedTags.length >= maxTags}
          >
            <span className="truncate">
              {searchQuery || "Select or create tags..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <CommandPrimitive
            className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
            shouldFilter={false} // Add this to handle filtering manually
          >
            <CommandList>
              <CommandInput
                placeholder={loading ? "Searching..." : "Search tags..."}
                value={searchQuery}
                onValueChange={handleSearchChange}
                className={loading ? "opacity-70" : ""}
                disabled={loading}
              />
              <CommandEmpty>
                {loading ? (
                  <p className="p-2 text-sm text-muted-foreground text-center">
                    Searching...
                  </p>
                ) : searchQuery && (
                  <button
                    className="p-2 text-sm text-muted-foreground hover:bg-accent w-full text-left"
                    onClick={() => handleSelect(searchQuery)}
                  >
                    Create tag &quot;{searchQuery}&quot;
                  </button>
                )}
              </CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => handleSelect(tag.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.some(t => t.id === tag.id) 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandPrimitive>
        </PopoverContent>
      </Popover>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className={cn(
              "px-2 py-1",
              disabled ? "opacity-50" : "hover:bg-secondary/80"
            )}
          >
            {tag.name}
            {!disabled && (
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => handleRemove(tag.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag.name}</span>
              </button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}