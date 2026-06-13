import {
  QueryClient,
  QueryClientProvider,
  useQuery as useQueryForTest,
} from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ApiError } from '@/shared/api/errors'
import { queryRetry, shouldRetryError } from '@/shared/api/query-retry'

function apiErr(status: number): ApiError {
  return new ApiError(status, status === 0 ? 'OFFLINE' : 'UNKNOWN', `status ${status}`)
}

describe('shouldRetryError', () => {
  it.each([400, 401, 403, 404, 409, 422, 429])('does not retry HTTP %i', (status) => {
    expect(shouldRetryError(apiErr(status))).toBe(false)
  })

  it.each([500, 502, 503, 504])('retries HTTP %i (server error)', (status) => {
    expect(shouldRetryError(apiErr(status))).toBe(true)
  })

  it('retries network/offline errors (status 0)', () => {
    expect(shouldRetryError(apiErr(0))).toBe(true)
  })

  it('retries non-ApiError failures (unexpected/network layer)', () => {
    expect(shouldRetryError(new Error('boom'))).toBe(true)
    expect(shouldRetryError(undefined)).toBe(true)
  })
})

describe('queryRetry', () => {
  it.each([400, 401, 403, 404])('never retries %i regardless of attempt count', (status) => {
    expect(queryRetry(1, apiErr(status))).toBe(false)
    expect(queryRetry(3, apiErr(status))).toBe(false)
    expect(queryRetry(10, apiErr(status))).toBe(false)
  })

  it('retries 5xx up to 3 attempts then stops', () => {
    expect(queryRetry(1, apiErr(500))).toBe(true)
    expect(queryRetry(2, apiErr(500))).toBe(true)
    expect(queryRetry(3, apiErr(500))).toBe(false)
    expect(queryRetry(4, apiErr(500))).toBe(false)
  })

  it('stops network retries after 3 attempts', () => {
    expect(queryRetry(1, new Error('network down'))).toBe(true)
    expect(queryRetry(3, new Error('network down'))).toBe(false)
  })
})

describe('queryRetry integrated with react-query', () => {
  function createWrapper() {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: queryRetry, retryDelay: 1 },
        mutations: { retry: 0 },
      },
    })
    return function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    }
  }

  it('makes no repeated requests when the API returns 401', async () => {
    const queryFn = vi.fn().mockRejectedValue(apiErr(401))
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => useQueryForTest({ queryKey: ['m11', 'unauthorized'], queryFn }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    // Give react-query ample time to schedule any further refetches.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('makes no repeated requests when the API returns 404', async () => {
    const queryFn = vi.fn().mockRejectedValue(apiErr(404))
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => useQueryForTest({ queryKey: ['m11', 'not-found'], queryFn }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('retries a 503 at most 3 times, then stays in error state', async () => {
    const queryFn = vi.fn().mockRejectedValue(apiErr(503))
    const wrapper = createWrapper()

    const { result } = renderHook(
      () => useQueryForTest({ queryKey: ['m11', 'server-error'], queryFn }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 2000 })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })
    // 1 initial + 3 retries, then permanent error state.
    expect(queryFn).toHaveBeenCalledTimes(4)
  }, 5000)
})
