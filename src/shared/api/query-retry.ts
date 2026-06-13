import { ApiError } from './errors'

/**
 * True only for failures that are worth retrying automatically:
 * network/offline errors and HTTP 5xx. Client mistakes (4xx - 401/403/404,
 * validation, etc.) will never succeed on retry, so we must stop immediately
 * and leave the query in the error state.
 */
export function shouldRetryError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true
  return error.status === 0 || error.status >= 500
}

/**
 * react-query `retry` callback: at most 3 attempts for network/5xx errors,
 * none for 4xx. Combined with react-query's default exponential backoff this
 * replaces the old "refetch every 5s while in error state" behaviour that
 * hammered the API even on permanent 401/403 responses.
 */
export function queryRetry(failureCount: number, error: unknown): boolean {
  return shouldRetryError(error) && failureCount < 3
}
