import { useQuery, keepPreviousData } from '@tanstack/react-query';
import privateApi from '@/providers/privateAxios';
import type { PaginatedResponse, ListParams } from '@/types/api';

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Fetches one page from any list endpoint.
 *
 * `keepPreviousData` holds the current rows on screen while the next page
 * loads, so paging does not blank the table out.
 */
export function usePaginatedQuery<T>(
  endpoint: string,
  queryKey: unknown[],
  page: number,
  pageSize: number,
  search = '',
  sortBy = '',
  sortOrder: 'asc' | 'desc' = 'desc',
  extraParams: ListParams = {}
) {
  return useQuery<PaginatedResult<T>>({
    queryKey,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: ListParams = {
        page,
        limit: pageSize,
        ...extraParams
      };

      // Only send the optional filters that carry a value — an empty `search`
      // would otherwise widen the SQL WHERE clause for nothing.
      if (search) params.search = search;
      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      const response = await privateApi.get<PaginatedResponse<T>>(endpoint, { params });
      const body = response.data;

      return {
        items: body.data ?? [],
        page: body.page,
        pageSize: body.pageSize,
        totalCount: body.total,
        totalPages: body.totalPages
      };
    }
  });
}
