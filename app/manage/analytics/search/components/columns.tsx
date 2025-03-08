"use client";

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
    // Change the parameter type from number to unknown to match DataTable's expectations
    cell: (value: unknown) => (
      <div className="text-right font-medium">
        {typeof value === 'number' ? value : 0}
      </div>
    )
  }
];