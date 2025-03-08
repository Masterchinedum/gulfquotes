"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

// Define the simplified props interface
interface DataTableProps<T extends Record<string, unknown>> {
  columns: {
    id: string;
    header: string;
    accessorKey: string;
    cell?: (value: unknown) => React.ReactNode;
  }[];
  data: T[];
  pageSize?: number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Sorting logic
  const sortedData = [...data].sort((a: T, b: T) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key;
    const aValue = a[key];
    const bValue = b[key];
    
    // Convert values to comparable types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // String comparison
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } 
    else if (typeof aValue === 'number' && typeof bValue === 'number') {
      // Number comparison
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    else if (aValue instanceof Date && bValue instanceof Date) {
      // Date comparison
      return sortConfig.direction === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    
    // Default string comparison (convert to string first)
    const aString = String(aValue);
    const bString = String(bValue);
    return sortConfig.direction === 'asc'
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });

  // Pagination logic
  const pageCount = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Handle column sorting
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id}>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort(column.accessorKey)}
                  >
                    {column.header}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column.id}`}>
                      {column.cell 
                        ? column.cell(row[column.accessorKey])
                        : row[column.accessorKey] as React.ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage + 1} of {Math.max(1, pageCount)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage >= pageCount - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}