import { expect, test, vi } from 'vitest'
import { ApiError } from '../api/client'
import { configureErrorReporting, isReportable, reportError } from './report'

test('only unexpected failures reach the error sink', () => {
  expect(isReportable(new ApiError('x', 500, 'http'))).toBe(true)
  expect(isReportable(new ApiError('x', 0, 'invalid_response'))).toBe(true)
  expect(isReportable(new TypeError('boom'))).toBe(true)
  for (const status of [401, 403, 404, 409, 422, 429])
    expect(isReportable(new ApiError('x', status))).toBe(false)
  expect(isReportable(new ApiError('offline'))).toBe(false)
  expect(isReportable(new DOMException('stop', 'AbortError'))).toBe(false)
})

test('a failing sink never breaks the caller', () => {
  const sink = vi.fn(() => {
    throw new Error('sink down')
  })
  configureErrorReporting(sink)
  expect(() => reportError(new Error('x'), { source: 'test' })).not.toThrow()
  expect(sink).toHaveBeenCalledOnce()
})
