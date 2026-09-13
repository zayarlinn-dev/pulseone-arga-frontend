/**
 * Response envelopes returned by the Go API.
 *
 * Every endpoint answers with one of these shapes, except the /dropdown routes
 * which return a bare array for the select components to consume directly.
 */

export interface ApiResponse<T> {
  timestamp: string;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  timestamp: string;
  message: string;
  /** A string in production; an array of field messages on validation failure. */
  error: string | string[];
  /** Correlation id, echoed in the X-Request-ID header. Quote it to support. */
  requestId?: string;
}

/** Paginated list envelope produced by implementations.List on the backend. */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** The shape every /dropdown endpoint returns. */
export interface DropdownItem {
  id: number;
  name: string;
}

/** Query parameters accepted by every list endpoint. */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  [key: string]: string | number | boolean | undefined;
}

/** Audit columns present on most records. */
export interface AuditFields {
  createdAt?: string;
  updatedAt?: string;
  createdUserId?: number;
  updatedUserId?: number;
}
