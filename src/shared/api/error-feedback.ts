import { ApiError } from './client'

export interface ErrorFeedback {
  message: string
  retryable: boolean
  /** Which state illustration fits, for full-page failures. */
  kind: 'error' | 'offline' | 'not-found' | 'access-denied'
}
// Translate stable categories. Never render raw backend/provider exception text.
export function errorFeedback(error: unknown): ErrorFeedback {
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? error.name
      : undefined
  if (name === 'TimeoutError')
    return { message: 'timeoutError', retryable: true, kind: 'offline' }
  if (name === 'AbortError')
    return { message: 'requestCancelled', retryable: true, kind: 'error' }
  if (error instanceof ApiError) {
    if (error.code === 'quota')
      return {
        message: 'quotaReached',
        retryable: false,
        kind: 'access-denied',
      }
    if (error.code === 'invalid_response')
      return { message: 'invalidResponse', retryable: true, kind: 'error' }
    switch (error.status) {
      case 401:
        return {
          message: 'sessionExpired',
          retryable: true,
          kind: 'access-denied',
        }
      case 403:
        return {
          message: 'deniedHint',
          retryable: false,
          kind: 'access-denied',
        }
      case 404:
        return {
          message: 'recordNotFound',
          retryable: false,
          kind: 'not-found',
        }
      case 409:
        return { message: 'conflict', retryable: true, kind: 'error' }
      case 422:
        return { message: 'formErrors', retryable: false, kind: 'error' }
      case 429:
        return { message: 'rateLimited', retryable: true, kind: 'error' }
      case 0:
        return { message: 'connectionError', retryable: true, kind: 'offline' }
    }
  }
  return { message: 'unavailable', retryable: true, kind: 'error' }
}
