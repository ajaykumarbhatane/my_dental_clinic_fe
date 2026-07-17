import { ChevronLeft, ChevronRight } from 'lucide-react';

const buildPageItems = (currentPage, totalPages) => {
  const pages = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('ellipsis');
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }
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
  const showFirst = !pageItems.includes(1) && totalPages > 1;
  const showLast = !pageItems.includes(totalPages) && totalPages > 1;

  return (
    <div className="flex w-full min-w-0 flex-row items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      {itemCountText && (
        <div className="min-w-0 text-xs text-gray-600 truncate text-center sm:text-left">
          {itemCountText}
        </div>
      )}

      <div className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto">
        {showFirst && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
            className="inline-flex items-center justify-center w-12 h-8 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-xs font-medium"
          >
            First
          </button>
        )}

        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex items-center justify-center w-10 h-8 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        {pageItems.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span key={`${page}-${index}`} className="inline-flex items-center justify-center w-6 h-8 text-xs text-gray-500">
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
          className="inline-flex items-center justify-center w-10 h-8 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="w-3 h-3" />
        </button>

        {showLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
            className="inline-flex items-center justify-center w-12 h-8 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-xs font-medium"
          >
            Last
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
