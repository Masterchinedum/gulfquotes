'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuoteFiltersProps {
  initialFilters: {
    search: string;
    category: string;
    author: string;
    sort: string;
  };
}

export function QuoteFilters({ initialFilters }: QuoteFiltersProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialFilters.search);
  const [category, setCategory] = useState(initialFilters.category);
  const [author, setAuthor] = useState(initialFilters.author);
  const [sortBy, setSortBy] = useState(initialFilters.sort);

  const updateUrl = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    url.searchParams.delete("page"); // Reset page when filtering
    router.push(url.pathname + url.search);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    updateUrl({ search: searchTerm });
  };

  const handleFilter = () => {
    if (!category && !author) return;
    updateUrl({ 
      category: category.trim(),
      author: author.trim()
    });
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    updateUrl({ sort: value });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 flex gap-4">
        <Input
          type="text"
          placeholder="Search quotes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
        />
        <Input
          type="text"
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
        />
        <Input
          type="text"
          placeholder="Filter by author..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
        />
      </div>

      <Select value={sortBy} onValueChange={handleSort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="popular">Most Popular</SelectItem>
          <SelectItem value="length">Length</SelectItem>
          <SelectItem value="alphabetical">A-Z</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button 
          onClick={handleSearch}
          disabled={!searchTerm.trim()}
        >
          Search
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleFilter}
          disabled={!category && !author}
        >
          Filter
        </Button>
      </div>
    </div>
  );
}