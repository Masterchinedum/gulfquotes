"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SearchFacets } from "@/types/search";

interface SearchFiltersProps {
  facets?: SearchFacets;
  onClose?: () => void;
  className?: string;
  isMobile?: boolean;
}

export function SearchFilters({ 
  facets, 
  onClose, 
  className, 
  isMobile = false 
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortField, setSortField] = useState<string>("relevance");
  const [sortDirection, setSortDirection] = useState<string>("desc");
  const [featured, setFeatured] = useState<boolean>(false);

  // Initialize filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    // Parse categories
    const categories = params.get("categories")?.split(",") || [];
    setSelectedCategories(categories);
    
    // Parse authors
    const authors = params.get("authors")?.split(",") || [];
    setSelectedAuthors(authors);
    
    // Parse tags
    const tags = params.get("tags")?.split(",") || [];
    setSelectedTags(tags);
    
    // Parse dates
    const fromDate = params.get("dateFrom");
    if (fromDate) setDateFrom(new Date(fromDate));
    
    const toDate = params.get("dateTo");
    if (toDate) setDateTo(new Date(toDate));
    
    // Parse sort options
    setSortField(params.get("sortField") || "relevance");
    setSortDirection(params.get("sortDirection") || "desc");
    
    // Parse featured flag
    setFeatured(params.get("featured") === "true");
  }, [searchParams]);

  // Apply filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    const q = params.get("q") || "";
    
    // Build new params
    const newParams = new URLSearchParams();
    newParams.set("q", q);
    
    if (selectedCategories.length > 0) {
      newParams.set("categories", selectedCategories.join(","));
    }
    
    if (selectedAuthors.length > 0) {
      newParams.set("authors", selectedAuthors.join(","));
    }
    
    if (selectedTags.length > 0) {
      newParams.set("tags", selectedTags.join(","));
    }
    
    if (dateFrom) {
      newParams.set("dateFrom", dateFrom.toISOString());
    }
    
    if (dateTo) {
      newParams.set("dateTo", dateTo.toISOString());
    }
    
    if (sortField !== "relevance") {
      newParams.set("sortField", sortField);
    }
    
    if (sortDirection !== "desc") {
      newParams.set("sortDirection", sortDirection);
    }
    
    if (featured) {
      newParams.set("featured", "true");
    }
    
    // Reset to page 1 when filtering
    newParams.set("page", "1");
    
    router.push(`/search?${newParams.toString()}`);
    
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q") || "";
    params.set("q", q);
    router.push(`/search?${params.toString()}`);
    
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setSelectedTags([]);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortField("relevance");
    setSortDirection("desc");
    setFeatured(false);
    
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Check if any filter is active
  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    selectedAuthors.length > 0 || 
    selectedTags.length > 0 || 
    dateFrom !== undefined || 
    dateTo !== undefined || 
    sortField !== "relevance" || 
    sortDirection !== "desc" || 
    featured;

  return (
    <div className={cn("w-full space-y-4", className)}>
      {isMobile && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Accordion type="multiple" defaultValue={["sort", "type", "categories"]}>
        {/* Sort Options */}
        <AccordionItem value="sort">
          <AccordionTrigger>Sort By</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortDirection} onValueChange={setSortDirection}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category Filters */}
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {facets?.categories && facets.categories.length > 0 ? (
                facets.categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`category-${category.id}`} 
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter((id) => id !== category.id)
                          );
                        }
                      }}
                    />
                    <label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm flex justify-between w-full cursor-pointer"
                    >
                      <span>{category.name}</span>
                      <span className="text-muted-foreground">{category.count}</span>
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No categories available</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Author Filters */}
        <AccordionItem value="authors">
          <AccordionTrigger>Authors</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {facets?.authors && facets.authors.length > 0 ? (
                facets.authors.map((author) => (
                  <div key={author.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`author-${author.id}`} 
                      checked={selectedAuthors.includes(author.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAuthors([...selectedAuthors, author.id]);
                        } else {
                          setSelectedAuthors(
                            selectedAuthors.filter((id) => id !== author.id)
                          );
                        }
                      }}
                    />
                    <label 
                      htmlFor={`author-${author.id}`}
                      className="text-sm flex justify-between w-full cursor-pointer"
                    >
                      <span>{author.name}</span>
                      <span className="text-muted-foreground">{author.count}</span>
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No authors available</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Date Filter */}
        <AccordionItem value="date">
          <AccordionTrigger>Date Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm">From</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col space-y-2">
                <span className="text-sm">To</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Featured Filter */}
        <AccordionItem value="featured">
          <AccordionTrigger>Other Filters</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="featured" 
                  checked={featured}
                  onCheckedChange={(checked) => setFeatured(checked === true)}
                />
                <label 
                  htmlFor="featured"
                  className="text-sm cursor-pointer"
                >
                  Featured content only
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Buttons */}
      <div className="pt-4 flex gap-2">
        <Button onClick={applyFilters} className="flex-1">Apply Filters</Button>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="flex-1"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}