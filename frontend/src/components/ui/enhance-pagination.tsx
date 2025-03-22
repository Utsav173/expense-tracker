'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedPaginationProps {
  totalRecords: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  variant?: 'default' | 'minimalist' | 'pill';
  showFirstLast?: boolean;
  showTotal?: boolean;
  maxDisplayedPages?: number;
  isMobile?: boolean;
}

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  totalRecords,
  pageSize,
  currentPage,
  onPageChange,
  className = '',
  variant = 'default',
  showFirstLast = true,
  showTotal = true,
  maxDisplayedPages = 5,
  isMobile
}) => {
  const totalPages = Math.ceil(totalRecords / pageSize);
  const [inputPage, setInputPage] = useState(currentPage.toString());
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Sync input field with external page changes
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // Restrict input to numeric values only
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInputPage(value);
    }
  };

  // Navigate on Enter key press
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(inputPage);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onPageChange(pageNum);
      } else {
        setInputPage(currentPage.toString());
      }
    }
  };

  // Navigate on blur (losing focus)
  const handleInputBlur = () => {
    setIsInputFocused(false);
    const pageNum = parseInt(inputPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setInputPage(currentPage.toString());
    }
  };

  const renderPageNumbers = () => {
    const mobileMaxPages = 3;
    const actualMaxPages = isMobile ? mobileMaxPages : maxDisplayedPages;
    let pagesToShow: (number | 'ellipsis')[] = [];

    if (totalPages <= actualMaxPages + 2) {
      pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pagesToShow = [1];
      let startPage = Math.max(2, currentPage - Math.floor((actualMaxPages - 2) / 2));
      let endPage = Math.min(totalPages - 1, startPage + actualMaxPages - 3);

      if (endPage === totalPages - 1) {
        startPage = Math.max(2, endPage - (actualMaxPages - 3));
      }

      if (startPage > 2) {
        pagesToShow.push('ellipsis');
      }

      for (let i = startPage; i <= endPage; i++) {
        pagesToShow.push(i);
      }

      if (endPage < totalPages - 1) {
        pagesToShow.push('ellipsis');
      }

      pagesToShow.push(totalPages);
    }

    return pagesToShow.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <div key={`ellipsis-${index}`} className='flex items-center justify-center px-2'>
            <MoreHorizontal className='h-4 w-4 text-gray-400' />
          </div>
        );
      }

      return (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            'transition-all duration-200',
            variant === 'pill' ? 'rounded-full' : 'rounded-md',
            'flex h-9 min-w-9 items-center justify-center',
            page === currentPage
              ? 'scale-105 bg-primary font-medium text-primary-foreground shadow-sm'
              : 'bg-transparent text-gray-700 hover:bg-gray-100',
            variant === 'minimalist' &&
              page === currentPage &&
              'rounded-none border-b-2 border-primary bg-transparent text-primary',
            variant === 'minimalist' && 'hover:bg-transparent'
          )}
        >
          {page}
        </button>
      );
    });
  };

  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-between gap-4 sm:flex-row',
        className
      )}
    >
      {showTotal && (
        <div className='order-2 text-sm text-gray-500 sm:order-1'>
          {isMobile ? (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          ) : (
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} to{' '}
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'order-1 flex items-center gap-1 sm:order-2 sm:gap-2',
          !showTotal && 'mx-auto',
          showTotal && 'w-full justify-center sm:w-auto sm:justify-end'
        )}
      >
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={cn(
              'rounded-md p-2 transition-colors',
              currentPage === 1
                ? 'cursor-not-allowed text-gray-300'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            aria-label='First page'
          >
            <ChevronsLeft className='h-4 w-4' />
          </button>
        )}

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'rounded-md p-2 transition-colors',
            currentPage === 1
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label='Previous page'
        >
          <ChevronLeft className='h-4 w-4' />
        </button>

        {!isMobile || totalPages <= 5 ? (
          <div className='flex items-center'>{renderPageNumbers()}</div>
        ) : (
          <div className='relative flex items-center'>
            <div
              className={cn(
                'flex items-center rounded-md border px-2 transition-all',
                isInputFocused ? 'border-primary' : 'border-gray-200',
                'h-9 min-w-12'
              )}
            >
              <input
                type='text'
                value={inputPage}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={handleInputBlur}
                className='w-full bg-transparent text-center outline-none'
                aria-label='Page number'
                placeholder='Go to'
              />
            </div>
            <span className='mx-2 text-sm text-gray-500'>of {totalPages}</span>
          </div>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'rounded-md p-2 transition-colors',
            currentPage === totalPages
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label='Next page'
        >
          <ChevronRight className='h-4 w-4' />
        </button>

        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              'rounded-md p-2 transition-colors',
              currentPage === totalPages
                ? 'cursor-not-allowed text-gray-300'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            aria-label='Last page'
          >
            <ChevronsRight className='h-4 w-4' />
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedPagination;
