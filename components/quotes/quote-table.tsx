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
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

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

  // Filter quotes based on search term
  const filteredQuotes = quotes.filter((quote) =>
    quote.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.author.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search quotes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/manage/quotes/create")}>
          <Icons.plus className="mr-2 h-4 w-4" />
          Add Quote
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                  <TableCell>{formatDate(quote.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Icons.more className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/manage/quotes/${quote.slug}`)}
                        >
                          <Icons.pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(quote)}
                          disabled={isDeleting === quote.id}
                          className="text-destructive"
                        >
                          {isDeleting === quote.id ? (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Icons.trash className="mr-2 h-4 w-4" />
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