"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface SearchInputProps {
  onSearch: (term: string) => void;
  defaultValue?: string;
}

export function SearchInput({ onSearch, defaultValue = "" }: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSearch = useDebouncedCallback((term: string) => {
    onSearch(term);
  }, 300);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    handleSearch(e.target.value);
  }, [handleSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search users..."
        onChange={onChange}
        value={value}
        className="pl-8"
      />
    </div>
  );
}