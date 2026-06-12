import React from 'react';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = false,
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between w-full">
      {showInfo && (
        <div className="text-sm text-[var(--text-secondary)]">
          Trang <span className="font-medium text-[var(--text-primary)]">{currentPage}</span> / {totalPages}
        </div>
      )}
      
      <div className={cn('flex items-center gap-1.5', !showInfo && 'mx-auto')}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--bg-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Trước
        </button>
        
        {pages.map((p, i) => (
          typeof p === 'number' ? (
            <button
              key={i}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm font-medium',
                currentPage === p 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="px-1 text-[var(--text-muted)]">...</span>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--bg-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Sau
        </button>
      </div>
    </div>
  );
};
