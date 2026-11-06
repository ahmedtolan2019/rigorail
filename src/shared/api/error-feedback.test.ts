import { expect, test } from 'vitest'
import { ApiError } from './client'
import { errorFeedback } from './error-feedback'
test('maps common failures without exposing raw server text or encouraging invalid retries', () => {
  for (const [status, message, retryable, kind] of [
    [401, 'sessionExpired', true, 'access-denied'],
    [403, 'deniedHint', false, 'access-denied'],
    [404, 'recordNotFound', false, 'not-found'],
    [409, 'conflict', true, 'error'],
    [422, 'formErrors', false, 'error'],
    [429, 'rateLimited', true, 'error'],
    [503, 'unavailable', true, 'error'],
  ] as const) {
    expect(
      errorFeedback(new ApiError('Sensitive backend detail', status)),
    ).toEqual({ message, retryable, kind })
  }
  expect(
    errorFeedback(new DOMException('Timed out', 'TimeoutError')),
  ).toMatchObject({ message: 'timeoutError', kind: 'offline' })
  expect(errorFeedback(new ApiError('Network down'))).toMatchObject({
    message: 'connectionError',
    kind: 'offline',
  })
  expect(
    errorFeedback(new ApiError('Bad shape', 200, 'invalid_response')).message,
  ).toBe('invalidResponse')
})
