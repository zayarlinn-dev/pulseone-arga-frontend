import axios from 'axios';
import i18n from 'i18next';
import type { ApiErrorResponse } from '@/types/api';

/**
 * Extracts a message worth showing the user from an API failure.
 *
 * The backend answers with { message, error }, where `error` is an array of
 * field messages when validation fails. Anything unrecognisable falls back to
 * the caller's own wording rather than leaking a raw stack or Axios internals.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    const status = error.response?.status ?? 0;

    // Server faults are the ones support has to trace, so the correlation id is
    // appended for the user to quote. Client errors (4xx) are self-explanatory
    // and the id would just be noise.
    const reference =
      status >= 500 && data?.requestId
        ? ` ${i18n.t('common.error.reference', { id: data.requestId })}`
        : '';

    if (data) {
      // Validation failures carry the useful detail in `error`.
      if (Array.isArray(data.error) && data.error.length > 0) {
        return data.error.join(', ');
      }
      if (data.message) {
        return data.message + reference;
      }
      if (typeof data.error === 'string' && data.error) {
        return data.error + reference;
      }
    }

    if (error.code === 'ECONNABORTED') {
      return i18n.t('common.error.timeout');
    }
    if (!error.response) {
      return i18n.t('common.error.unreachable');
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * A failed request, carrying the status alongside the user-facing message.
 *
 * Services rethrow their own Error so callers get wording rather than an Axios
 * object, but a bare Error drops the status — and the query client's retry
 * guard needs it to tell "you may not do this" (403, never retry) from "the
 * network hiccuped" (retry). Without it a permission failure was retried twice
 * and the screen sat on skeletons for the whole round trip.
 */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Wraps any request failure as an ApiError with its message and status. */
export function toApiError(error: unknown, fallback: string): ApiError {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return new ApiError(getApiErrorMessage(error, fallback), status);
}
