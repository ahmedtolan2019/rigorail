import { ApiError } from './client'

export interface ErrorFeedback {
  message: string
  retryable: boolean
}
// Translate stable categories. Never render raw backend/provider exception text.
export function errorFeedback(error: unknown): ErrorFeedback {
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? error.name
      : undefined
  if (name === 'TimeoutError')
    return { message: 'timeoutError', retryable: true }
  if (name === 'AbortError')
    return { message: 'requestCancelled', retryable: true }
  if (error instanceof ApiError) {
    if (error.code === 'quota')
      return { message: 'quotaReached', retryable: false }
    if (error.code === 'invalid_response')
      return { message: 'invalidResponse', retryable: true }
    switch (error.status) {
      case 401:
        return { message: 'sessionExpired', retryable: true }
      case 403:
        return { message: 'deniedHint', retryable: false }
      case 404:
        return { message: 'recordNotFound', retryable: false }
      case 409:
        return { message: 'conflict', retryable: true }
      case 422:
        return { message: 'formErrors', retryable: false }
      case 429:
        return { message: 'rateLimited', retryable: true }
      case 0:
        return { message: 'connectionError', retryable: true }
    }
  }
  return { message: 'unavailable', retryable: true }
}
