interface QuotePaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export function QuotePagination({ currentPage, hasMore, onPageChange }: QuotePaginationProps) {
  return (
    <div className="flex justify-center mt-10">
      <nav className="flex gap-2">
        {currentPage > 1 && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            Previous
          </button>
        )}
        {hasMore && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            Next
          </button>
        )}
      </nav>
    </div>
  );
}