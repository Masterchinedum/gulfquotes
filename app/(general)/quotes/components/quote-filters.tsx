import { useState } from "react";

interface QuoteFiltersProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: { category?: string; author?: string }) => void;
}

export function QuoteFilters({ onSearch, onFilter }: QuoteFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleFilter = () => {
    onFilter({ category, author });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <input
        type="text"
        placeholder="Search quotes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Filter by category..."
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Filter by author..."
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border p-2 rounded"
      />
      <button onClick={handleSearch} className="bg-primary text-white p-2 rounded">
        Search
      </button>
      <button onClick={handleFilter} className="bg-secondary text-white p-2 rounded">
        Filter
      </button>
    </div>
  );
}