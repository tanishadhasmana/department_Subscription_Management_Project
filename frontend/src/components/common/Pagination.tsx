// src/components/common/Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
}) => {
  // the fucn that generate arr of page numbers
  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
// if there are 7 or few pages than display all page numbers
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // else if pages >7, and <= 4  then show first 5 pages then ...
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
        // if pages page ≥ totalPages - 3) then 1, ... , 16,17 etc
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-4 gap-3">
      {/* Limit selector */}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">Show:</label>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-blue-300"
        >
          {[5, 10, 20, 50].map((num) => (
            <option key={num} value={num}>
              {num} / page
            </option>
          ))}
        </select>
      </div>

      {/* Page navigation */}
      <div className="flex items-center flex-wrap justify-center gap-1">
        {/* Prev */}
        <button
          className={`px-3 py-1 border rounded text-sm ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-200"
          }`}
          disabled={currentPage === 1}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        >
          &lt;
        </button>

        {/* Page numbers */}
        {/* page for page number, and index for ... placing */}
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={page}
              className={`px-3 py-1 border rounded text-sm ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          className={`px-3 py-1 border rounded text-sm ${
            currentPage === totalPages || totalPages === 0
              ? "text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-200"
          }`}
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() =>
            currentPage < totalPages && onPageChange(currentPage + 1)
          }
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;

