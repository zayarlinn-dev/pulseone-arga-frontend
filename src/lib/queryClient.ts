import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/getApiErrorMessage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // List data is re-fetched on demand via invalidation, so a short stale
      // window avoids a refetch storm when a user tabs between screens.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Never retry an auth or permission failure — the answer will not change.
        // The services rethrow an ApiError, so the status lives on the error
        // itself; the `response` shape covers anything thrown by raw Axios.
        const status =
          error instanceof ApiError
            ? error.status
            : (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      }
    },
    mutations: { retry: false }
  }
});
