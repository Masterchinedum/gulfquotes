"use client";

// Remove unused ArrowUpDown import
// import { ArrowUpDown } from "lucide-react";

// Export the interface so we can use it
export interface QueryData {
  query: string;
  count: number;
}

export const columns = [
  {
    id: "query",
    header: "Search Query",
    accessorKey: "query",
  },
  {
    id: "count", 
    header: "Search Count",
    accessorKey: "count",
    cell: (value: number) => (
      <div className="text-right font-medium">{value}</div>
    )
  }
];