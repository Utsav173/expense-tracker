'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const totalPages = useMemo(() => Math.ceil(totalRecords / pageSize), [totalRecords, pageSize]);
  const [inputPage, setInputPage] = useState(currentPage.toString());
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInputPage(value);
    }
  }, []);

  const handlePageNavigation = useCallback(
    (pageNum: number) => {
      if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
        onPageChange(pageNum);
      }
    },
    [currentPage, onPageChange, totalPages]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const pageNum = parseInt(inputPage);
        if (!isNaN(pageNum)) {
          handlePageNavigation(pageNum);
        } else {
          setInputPage(currentPage.toString());
        }
      }
    },
    [inputPage, currentPage, handlePageNavigation]
  );

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
    const pageNum = parseInt(inputPage);
    if (!isNaN(pageNum)) {
      handlePageNavigation(pageNum);
    } else {
      setInputPage(currentPage.toString());
    }
  }, [inputPage, currentPage, handlePageNavigation]);

  const pagesToShow = useMemo(() => {
    const mobileMaxPages = 3;
    const actualMaxPages = isMobile ? mobileMaxPages : maxDisplayedPages;
    let pages: (number | 'ellipsis')[] = [];

    if (totalPages <= actualMaxPages + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    let startPage = Math.max(2, currentPage - Math.floor((actualMaxPages - 2) / 2));
    let endPage = Math.min(totalPages - 1, startPage + actualMaxPages - 3);

    if (endPage === totalPages - 1) {
      startPage = Math.max(2, endPage - (actualMaxPages - 3));
    }

    if (startPage > 2) {
      pages.push('ellipsis');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);

    return pages;
  }, [totalPages, maxDisplayedPages, isMobile, currentPage]);

  if (totalPages <= 1) return null;

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const currentStart = Math.min((currentPage - 1) * pageSize + 1, totalRecords);
  const currentEnd = Math.min(currentPage * pageSize, totalRecords);

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
              Showing {currentStart} to {currentEnd} of {totalRecords} records
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
          <Button
            onClick={() => handlePageNavigation(1)}
            disabled={isFirstPage}
            size='icon'
            variant='ghost'
            aria-label='First page'
          >
            <ChevronsLeft className='h-4 w-4' />
          </Button>
        )}

        <Button
          onClick={() => handlePageNavigation(currentPage - 1)}
          disabled={isFirstPage}
          size='icon'
          variant='ghost'
          aria-label='Previous page'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        {!isMobile || totalPages <= 5 ? (
          <div className='flex items-center'>
            {pagesToShow.map((page, index) =>
              page === 'ellipsis' ? (
                <div key={`ellipsis-${index}`} className='flex items-center justify-center px-2'>
                  <MoreHorizontal className='h-4 w-4 text-gray-400' />
                </div>
              ) : (
                <Button
                  key={page}
                  onClick={() => handlePageNavigation(page)}
                  variant={page === currentPage ? 'default' : 'ghost'}
                  className={cn(
                    'h-9 min-w-9',
                    variant === 'pill' && 'rounded-full',
                    variant === 'minimalist' &&
                      page === currentPage &&
                      'border-primary text-primary rounded-none border-b-2 bg-transparent hover:bg-transparent'
                  )}
                >
                  {page}
                </Button>
              )
            )}
          </div>
        ) : (
          <div className='relative flex items-center'>
            <Input
              type='text'
              value={inputPage}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={handleInputBlur}
              className='h-7 w-8 min-w-4 border-none bg-transparent p-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0'
              aria-label='Page number'
              placeholder='Go to'
            />
            <span className='mx-2 text-sm text-gray-500'>of {totalPages}</span>
          </div>
        )}

        <Button
          onClick={() => handlePageNavigation(currentPage + 1)}
          disabled={isLastPage}
          size='icon'
          variant='ghost'
          aria-label='Next page'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>

        {showFirstLast && (
          <Button
            onClick={() => handlePageNavigation(totalPages)}
            disabled={isLastPage}
            size='icon'
            variant='ghost'
            aria-label='Last page'
          >
            <ChevronsRight className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(EnhancedPagination);
