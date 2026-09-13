import privateApi from '@/providers/privateAxios';
import { toApiError } from '@/lib/getApiErrorMessage';
import type { ApiResponse, DropdownItem, ListParams, PaginatedResponse } from '@/types/api';

/**
 * Builds a typed client for a standard CRUD resource.
 *
 * Every administration endpoint on the Go API exposes the same five verbs plus
 * an optional /dropdown, so each module gets its client from here rather than
 * repeating forty near-identical lines. Modules with extra endpoints extend the
 * returned object.
 */
/**
 * Attaches an idempotency key when the caller supplied one.
 *
 * It is optional here and mandatory in practice for anything that moves stock:
 * without a key, an operator who sees nothing happen and presses the button
 * again sends a second request the backend cannot tell from a genuine second
 * document, and the stock is deducted twice. Screens build their key with
 * `useIdempotencyKey` so it survives the retry but not the next submission.
 */
function idempotent(idempotencyKey?: string) {
  return idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined;
}

export function createResourceService<T, TCreate = Partial<T>, TUpdate = Partial<T>>(
  baseUrl: string,
  label: string
) {
  return {
    baseUrl,

    async getList(params: ListParams = {}): Promise<PaginatedResponse<T>> {
      try {
        const response = await privateApi.get<PaginatedResponse<T>>(baseUrl, { params });
        return response.data;
      } catch (error) {
        throw toApiError(error, `Failed to fetch ${label}`);
      }
    },

    async getById(id: number | string): Promise<T> {
      try {
        const response = await privateApi.get<ApiResponse<T>>(`${baseUrl}/${id}`);
        return response.data.data;
      } catch (error) {
        throw toApiError(error, `Failed to fetch ${label}`);
      }
    },

    async create(payload: TCreate, idempotencyKey?: string): Promise<T> {
      try {
        const response = await privateApi.post<ApiResponse<T>>(
          baseUrl,
          payload,
          idempotent(idempotencyKey)
        );
        return response.data.data;
      } catch (error) {
        throw toApiError(error, `Failed to create ${label}`);
      }
    },

    async update(id: number | string, payload: TUpdate, idempotencyKey?: string): Promise<T> {
      try {
        const response = await privateApi.put<ApiResponse<T>>(
          `${baseUrl}/${id}`,
          payload,
          idempotent(idempotencyKey)
        );
        return response.data.data;
      } catch (error) {
        throw toApiError(error, `Failed to update ${label}`);
      }
    },

    async remove(id: number | string): Promise<void> {
      try {
        await privateApi.delete(`${baseUrl}/${id}`);
      } catch (error) {
        throw toApiError(error, `Failed to delete ${label}`);
      }
    },

    /** Dropdown endpoints return a bare array, not the data envelope. */
    async getDropdown(params: Record<string, string | number | undefined> = {}): Promise<DropdownItem[]> {
      try {
        const response = await privateApi.get<DropdownItem[]>(`${baseUrl}/dropdown`, { params });
        return response.data ?? [];
      } catch (error) {
        throw toApiError(error, `Failed to fetch ${label} options`);
      }
    }
  };
}

export type ResourceService<T, TCreate = Partial<T>, TUpdate = Partial<T>> = ReturnType<
  typeof createResourceService<T, TCreate, TUpdate>
>;
