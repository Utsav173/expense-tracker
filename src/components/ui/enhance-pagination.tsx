'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from './icon';

interface EnhancedPaginationProps {
  totalRecords: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  isMobile?: boolean;
}

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  totalRecords,
  pageSize,
  currentPage,
  onPageChange,
  className = '',
  isMobile
}) => {
  const totalPages = useMemo(() => Math.ceil(totalRecords / pageSize), [totalRecords, pageSize]);
  const [inputPage, setInputPage] = useState(currentPage.toString());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only update input when not focused to prevent interference while typing
    if (!isInputFocused && currentPage.toString() !== inputPage) {
      setInputPage(currentPage.toString());
    }
  }, [currentPage, inputPage, isInputFocused]);

  const handlePageNavigation = useCallback(
    (page: number | string) => {
      const pageNum = Number(page);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
        onPageChange(pageNum);
      }
    },
    [currentPage, totalPages, onPageChange]
  );

  const commitPageInput = useCallback(() => {
    const pageNum = parseInt(inputPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      if (pageNum !== currentPage) {
        handlePageNavigation(pageNum);
      }
    } else {
      // Reset to current page if invalid input
      setInputPage(currentPage.toString());
    }
  }, [inputPage, currentPage, totalPages, handlePageNavigation]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPageInput();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setInputPage(currentPage.toString());
      e.currentTarget.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d+$/.test(value)) {
      setInputPage(value);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Small delay to prevent race conditions
    setTimeout(() => {
      commitPageInput();
    }, 10);
  };

  const pagesToShow = useMemo(() => {
    const maxDisplayedPages = 5;
    if (totalPages <= maxDisplayedPages + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    let startPage = Math.max(2, currentPage - Math.floor((maxDisplayedPages - 2) / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxDisplayedPages - 3);

    if (endPage === totalPages - 1) {
      startPage = Math.max(2, endPage - (maxDisplayedPages - 3));
    }
    if (startPage > 2) pages.push('ellipsis');
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  if (totalPages <= 1) return null;

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className={cn('flex w-full items-center justify-between gap-4', className)}>
      <div className='text-muted-foreground hidden text-sm sm:block'>
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} to{' '}
        {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
      </div>

      <div className={cn('flex w-full items-center justify-center gap-1 sm:w-auto sm:justify-end')}>
        <Button
          onClick={() => handlePageNavigation(1)}
          disabled={isFirstPage}
          size='icon'
          variant='outline'
          aria-label='First page'
        >
          <Icon name='chevronsLeft' className='h-4 w-4' />
        </Button>
        <Button
          onClick={() => handlePageNavigation(currentPage - 1)}
          disabled={isFirstPage}
          size='icon'
          variant='outline'
          aria-label='Previous page'
        >
          <Icon name='chevronLeft' className='h-4 w-4' />
        </Button>

        {isMobile ? (
          <div className='flex items-center px-2'>
            <Input
              ref={inputRef}
              type='text'
              value={inputPage}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className='border-muted h-9 w-10 bg-transparent text-center focus-visible:ring-1 focus-visible:ring-offset-0'
              aria-label='Page number'
            />
            <span className='text-muted-foreground ml-2'>/ {totalPages}</span>
          </div>
        ) : (
          <div className='hidden items-center sm:flex'>
            {pagesToShow.map((page, index) =>
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className='px-2'>
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  onClick={() => handlePageNavigation(page)}
                  variant={page === currentPage ? 'default' : 'ghost'}
                  size='icon'
                >
                  {page}
                </Button>
              )
            )}
          </div>
        )}

        <Button
          onClick={() => handlePageNavigation(currentPage + 1)}
          disabled={isLastPage}
          size='icon'
          variant='outline'
          aria-label='Next page'
        >
          <Icon name='chevronRight' className='h-4 w-4' />
        </Button>
        <Button
          onClick={() => handlePageNavigation(totalPages)}
          disabled={isLastPage}
          size='icon'
          variant='outline'
          aria-label='Last page'
        >
          <Icon name='chevronsRight' className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
};

export default React.memo(EnhancedPagination);
