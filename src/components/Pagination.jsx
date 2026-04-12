import { ChevronLeft, ChevronRight } from 'lucide-react';

const buildPageItems = (currentPage, totalPages) => {
  const pages = [];

  // Show first 3 pages
  for (let i = 1; i <= Math.min(3, totalPages); i++) {
    pages.push(i);
  }

  // Add ellipsis if more pages exist
  if (totalPages > 4) {
    pages.push('ellipsis');
  }

  // Add last page (if not already included)
  if (totalPages > 3) {
    pages.push(totalPages);
  }

  return pages;
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemCountText,
}) => {
  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      {itemCountText && (
        <div className="text-xs text-gray-600 whitespace-nowrap">{itemCountText}</div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageItems.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span key={`${page}-${index}`} className="inline-flex items-center justify-center w-8 h-8 text-xs text-gray-500">
                …
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`inline-flex items-center justify-center w-8 h-8 text-xs font-medium rounded-full border ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
