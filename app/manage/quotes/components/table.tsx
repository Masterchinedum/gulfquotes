"use client"

import { Quote, User, Category } from "@prisma/client"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PenIcon, TrashIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import Pagination from "@/components/ui/pagination"

interface QuoteTableProps {
  quotes: (Quote & {
    author: User;
    category: Category;
  })[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDelete?: (id: string) => void;
}

export function QuoteTable({ 
  quotes, 
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onDelete 
}: QuoteTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.content}</TableCell>
                <TableCell>{quote.author.name}</TableCell>
                <TableCell>{quote.category.name}</TableCell>
                <TableCell>{formatDate(quote.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/manage/quotes/${quote.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <PenIcon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                    {onDelete && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDelete(quote.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {quotes.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={5} 
                  className="h-24 text-center text-muted-foreground"
                >
                  No quotes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}