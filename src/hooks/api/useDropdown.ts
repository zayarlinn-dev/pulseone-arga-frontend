import { useQuery } from '@tanstack/react-query';
import privateApi from '@/providers/privateAxios';
import type { DropdownItem } from '@/types/api';

/**
 * Loads options for a select input.
 *
 * Dropdown endpoints return a bare array (not the data envelope), so the
 * response is used directly. Options change rarely, so they are cached for
 * five minutes rather than re-fetched per mount.
 */
export function useDropdown(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  enabled = true
) {
  return useQuery<DropdownItem[]>({
    queryKey: ['dropdown', endpoint, params],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const response = await privateApi.get<DropdownItem[]>(endpoint, { params });
      return response.data ?? [];
    }
  });
}
