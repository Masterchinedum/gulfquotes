// components/quotes/quote-table.tsx
"use client";

import { useState } from "react";
import { Quote, Category, UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { 
  Star, 
  Filter, 
  ChevronDown, 
  Eye,
  Pencil,
  Trash,
  Loader,
  MoreHorizontal,
  Plus
} from "lucide-react";

interface QuoteTableProps {
  initialQuotes: Array<Quote & {
    author: {
      id: string;
      name: string | null;
      email: string | null;
      emailVerified: Date | null;
      image: string | null;
      password: string | null;
      isTwoFactorEnabled: boolean;
      role: UserRole;
    };
    category: Category;
  }>;
}

export function QuoteTable({ initialQuotes }: QuoteTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  // Filter quotes based on search term and featured filter
  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch = 
      quote.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.author.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply featured filter if set
    if (filterFeatured !== null) {
      return matchesSearch && quote.featured === filterFeatured;
    }
    
    return matchesSearch;
  });

  const handleDelete = async (quote: Quote) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;

    setIsDeleting(quote.id);
    try {
      const response = await fetch(`/api/quotes/${quote.slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete quote");
      }

      setQuotes(quotes.filter((q) => q.id !== quote.id));
      toast({
        title: "Success",
        description: "Quote deleted successfully",
        variant: "default",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete quote",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (quote: Quote) => {
    setIsUpdating(quote.id);
    try {
      const response = await fetch(`/api/quotes/${quote.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featured: !quote.featured,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to update quote");
      }

      // Update local state
      setQuotes(quotes.map((q) => 
        q.id === quote.id ? { ...q, featured: !q.featured } : q
      ));
      
      toast({
        title: "Success",
        description: `Quote ${quote.featured ? "removed from" : "marked as"} featured successfully`,
        variant: "default",
      });
      
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update quote",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Bulk action to mark/unmark featured quotes
  const handleBulkFeature = async (featured: boolean) => {
    if (!confirm(`Are you sure you want to ${featured ? "feature" : "unfeature"} all displayed quotes?`)) return;
    
    try {
      // Process quotes in batches to avoid overwhelming the server
      const batchSize = 5;
      const quoteIds = filteredQuotes.map(q => q.id);
      
      for (let i = 0; i < quoteIds.length; i += batchSize) {
        const batch = quoteIds.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(id => {
            const quote = quotes.find(q => q.id === id);
            if (!quote) return Promise.resolve();
            
            // Only update if current status is different from target status
            if (quote.featured !== featured) {
              return fetch(`/api/quotes/${quote.slug}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featured }),
              });
            }
            
            return Promise.resolve();
          })
        );
      }
      
      // Update local state
      setQuotes(quotes.map(q => 
        filteredQuotes.some(fq => fq.id === q.id)
          ? { ...q, featured }
          : q
      ));
      
      toast({
        title: "Success",
        description: `Bulk update completed: ${filteredQuotes.length} quotes ${featured ? "marked as" : "removed from"} featured`,
        variant: "default",
      });
      
      router.refresh();
    } catch (error) {
      console.error("Bulk update failed:", error);
      toast({
        title: "Error",
        description: "Failed to update some quotes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 md:max-w-sm">
          <Input
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="px-3">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterFeatured === true}
                onCheckedChange={() => setFilterFeatured(filterFeatured === true ? null : true)}
              >
                Featured
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterFeatured === false}
                onCheckedChange={() => setFilterFeatured(filterFeatured === false ? null : false)}
              >
                Not Featured
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterFeatured(null)}>
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkFeature(true)}>
                <Star className="mr-2 h-4 w-4 text-primary" />
                Mark all as featured
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkFeature(false)}>
                <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                Remove all from featured
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => router.push("/manage/quotes/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Quote
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center"
                >
                  No quotes found.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="max-w-[300px]">
                    <div className="font-medium truncate">
                      {quote.content}
                    </div>
                  </TableCell>
                  <TableCell>{quote.author.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {quote.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={quote.featured}
                      onCheckedChange={() => handleToggleFeatured(quote)}
                      disabled={isUpdating === quote.id}
                      aria-label={`Toggle featured status for quote ${quote.id}`}
                    />
                  </TableCell>
                  <TableCell>{formatDate(quote.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/quotes/${quote.slug}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/manage/quotes/${quote.slug}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(quote)}
                          disabled={isUpdating === quote.id}
                        >
                          <Star className={`mr-2 h-4 w-4 ${quote.featured ? "text-primary" : "text-muted-foreground"}`} />
                          {quote.featured ? "Remove from featured" : "Mark as featured"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(quote)}
                          disabled={isDeleting === quote.id}
                          className="text-destructive"
                        >
                          {isDeleting === quote.id ? (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}