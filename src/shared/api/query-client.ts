import { QueryClient } from '@tanstack/react-query'
import { queryRetry } from './query-retry'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: queryRetry,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
