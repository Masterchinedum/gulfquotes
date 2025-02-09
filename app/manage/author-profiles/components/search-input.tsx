// File: app/manage/author-profiles/components/search-input.tsx

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface SearchInputProps {
  placeholder?: string;
}

export function SearchInput({ placeholder = "Search authors..." }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") || "");

  // Debounce the search to avoid too many requests
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset to first page on new search
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    handleSearch(e.target.value);
  }, [handleSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className="pl-8"
      />
    </div>
  );
}