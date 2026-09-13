import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePaginatedQuery } from './usePaginatedQuery';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import type { ListParams } from '@/types/api';
import type { ResourceService } from '@/services/createResourceService';

/**
 * List state for a resource page: search, paging and sorting, wired to a
 * paginated query.
 *
 * `queryKey` must include every input that changes the result, otherwise React
 * Query serves a stale page when the user searches or sorts.
 */
export function useResourceList<T>(
  endpoint: string,
  resourceKey: string,
  defaultSortBy: string | null = 'createdAt',
  extraParams: ListParams = {},
  /**
   * Newest-first is right for the dated lists this hook was written for, so it
   * stays the default. It is wrong for a list ordered by a rank column — an
   * options list sorted by `sort` descending shows the opposite order to the
   * dropdown it feeds — so those pass 'asc'.
   */
  defaultSortOrder: 'asc' | 'desc' = 'desc'
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string | null>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  // A filtered result set is shorter, so page 4 may not exist any more.
  useEffect(() => {
    setCurrentPage(DEFAULT_PAGE);
  }, [searchQuery, pageSize, JSON.stringify(extraParams)]);

  const { data, isLoading, isFetching, refetch } = usePaginatedQuery<T>(
    endpoint,
    [resourceKey, currentPage, pageSize, searchQuery, sortBy, sortOrder, extraParams],
    currentPage,
    pageSize,
    searchQuery,
    sortBy ?? '',
    sortOrder,
    extraParams
  );

  /** Cycles a column through ascending → descending → unsorted. */
  const handleSort = (column: string) => {
    if (sortBy === column) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy(null);
        setSortOrder('asc');
      }
      return;
    }
    setSortBy(column);
    setSortOrder('asc');
  };

  return {
    items: data?.items ?? [],
    loading: isLoading,
    isFetching,
    searchQuery,
    setSearchQuery,
    currentPage,
    totalPages: data?.totalPages ?? 1,
    pageSize,
    totalCount: data?.totalCount ?? 0,
    onPageChange: setCurrentPage,
    onPageSizeChange: setPageSize,
    sortBy,
    sortOrder,
    onSort: handleSort,
    refetch
  };
}

interface MutationOptions {
  onSuccess?: () => void;
}

/**
 * Create/update/delete mutations for a resource, with toasts and cache
 * invalidation already wired in.
 *
 * `label` is the already-translated name of the thing being saved — "Patient",
 * "လူနာ" — which callers get from their own catalogue slice. It is interpolated
 * into a whole sentence from the catalogue rather than concatenated with a verb
 * here, because Burmese puts the verb last and "${label} created" cannot be
 * reordered once it has been built.
 */
export function useResourceMutations<T, TCreate = Partial<T>, TUpdate = Partial<T>>(
  service: ResourceService<T, TCreate, TUpdate>,
  resourceKey: string,
  label: string,
  { onSuccess }: MutationOptions = {}
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [resourceKey] });
    // Options lists derive from the same rows, so they go stale too.
    queryClient.invalidateQueries({ queryKey: ['dropdown'] });
  };

  const { mutateAsync: create, isPending: isCreating } = useMutation({
    mutationFn: (payload: TCreate) => service.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success(t('common.toast.created', { item: label }));
      onSuccess?.();
    },
    onError: (error: Error) =>
      toast.error(error.message || t('common.toast.createFailed', { item: label }))
  });

  const { mutateAsync: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: TUpdate }) => service.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('common.toast.updated', { item: label }));
      onSuccess?.();
    },
    onError: (error: Error) =>
      toast.error(error.message || t('common.toast.updateFailed', { item: label }))
  });

  const { mutateAsync: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id: number | string) => service.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('common.toast.deleted', { item: label }));
      onSuccess?.();
    },
    onError: (error: Error) =>
      toast.error(error.message || t('common.toast.deleteFailed', { item: label }))
  });

  return {
    create,
    isCreating,
    update,
    isUpdating,
    remove,
    isDeleting,
    isMutating: isCreating || isUpdating || isDeleting
  };
}
