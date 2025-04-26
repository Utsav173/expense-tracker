import { ApiResponse } from '@/lib/types';

export interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryListData {
  categories: Category[];
  pagination: CategoryPagination;
}

export type CategoryListResponse = ApiResponse<CategoryListData>;

export interface CategoryFilters {
  searchQuery: string;
  debouncedSearchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
