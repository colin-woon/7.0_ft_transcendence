import React from 'react';

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#8EE7E3]"
      >
        Prev
      </button>

      {visiblePages.map((page) => (
        <button
          type="button"
          key={page}
          onClick={() => onPageChange(page)}
          className={`rounded-md px-3 py-1.5 text-xs sm:text-sm border transition ${
            currentPage === page
              ? 'border-[#0f6f6b] bg-[#0f6f6b] text-white'
              : 'border-gray-200 bg-white text-slate-700 hover:border-[#8EE7E3]'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#8EE7E3]"
      >
        Next
      </button>
    </div>
  );
}
