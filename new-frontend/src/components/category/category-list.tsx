import Loader from '../ui/loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ApiResponse, Category } from '@/lib/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '../ui/pagination';
import { Button } from '../ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import CategoryRow from './category-row';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';

interface CategoryListProps {
  data:
    | ApiResponse<{
        categories: Category[];
        pagination: any;
      }>
    | undefined;
  isLoading: boolean;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  handlePageChange: (page: number) => void;
}

const CategoryList = ({
  data,
  isLoading,
  onSort,
  sortBy,
  sortOrder,
  page,
  handlePageChange
}: CategoryListProps) => {
  const { refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll,
    enabled: false
  });
  return (
    <>
      {isLoading ? (
        <div className='flex items-center justify-center'>
          <Loader />
        </div>
      ) : !data?.categories?.length ? (
        <div className='py-8 text-center text-gray-500'>No Category found</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>
                <div className='flex items-center gap-2'>
                  Category
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() =>
                      onSort('name', sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                  >
                    {sortBy === 'name' && sortOrder === 'asc' ? (
                      <ArrowUp className='h-4 w-4' />
                    ) : (
                      <ArrowDown className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead className='w-[100px] text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.categories?.map((category) => (
              <CategoryRow category={category} key={category.id} onCategoryDeleted={refetch} />
            ))}
          </TableBody>
        </Table>
      )}
      {data?.pagination?.totalPages > 1 && (
        <Pagination className='mt-6'>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href='#' onClick={() => handlePageChange(page - 1)} />
              </PaginationItem>
            )}

            {Array.from({ length: data?.pagination?.totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p <= 2 || p >= data?.pagination?.totalPages - 1 || Math.abs(p - page) <= 1
              )
              .map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href='#'
                    isActive={p === page}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

            {page < data?.pagination?.totalPages && (
              <PaginationItem>
                <PaginationNext href='#' onClick={() => handlePageChange(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

export default CategoryList;
