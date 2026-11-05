import { expect, test } from 'vitest'
import { ApiError } from './client'
import { errorFeedback } from './error-feedback'
test('maps common failures without exposing raw server text or encouraging invalid retries', () => {
  for (const [status, message, retryable] of [
    [401, 'sessionExpired', true],
    [403, 'deniedHint', false],
    [404, 'recordNotFound', false],
    [409, 'conflict', true],
    [422, 'formErrors', false],
    [429, 'rateLimited', true],
    [503, 'unavailable', true],
  ] as const) {
    expect(
      errorFeedback(new ApiError('Sensitive backend detail', status)),
    ).toEqual({ message, retryable })
  }
  expect(
    errorFeedback(new DOMException('Timed out', 'TimeoutError')).message,
  ).toBe('timeoutError')
  expect(
    errorFeedback(new ApiError('Bad shape', 200, 'invalid_response')).message,
  ).toBe('invalidResponse')
})
