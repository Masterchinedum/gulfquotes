import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuoteFiltersProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: { category?: string; author?: string }) => void;
  onSort?: (sortOption: string) => void;
}

export function QuoteFilters({ onSearch, onFilter, onSort }: QuoteFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    onSearch(searchTerm);
  };

  const handleFilter = () => {
    if (!category && !author) return;
    onFilter({ 
      category: category.trim() || undefined,
      author: author.trim() || undefined 
    });
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    onSort?.(value);
  };

  // Handle Enter key press for search and filter inputs
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

      {onSort && (
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
      )}

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