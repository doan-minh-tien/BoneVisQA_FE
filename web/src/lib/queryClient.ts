import { QueryClient } from '@tanstack/react-query';

/** Default stale window for dashboard-style / semi-static data (5 minutes). */
export const QUERY_DEFAULT_STALE_TIME_MS = 300_000;

/**
 * Shared {@link QueryClient} factory for {@link QueryClientProvider}.
 * Call once per browser session (e.g. with `useState(createQueryClient)` in `AppProviders`).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_DEFAULT_STALE_TIME_MS,
        gcTime: 1000 * 60 * 30,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
