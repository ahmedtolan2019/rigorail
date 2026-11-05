import { expect, test } from 'vitest'
import { parseEnvironment } from './env'
test('requires an explicit demo selection or a real API URL without enabling AI by default', () => {
  expect(() => parseEnvironment({})).toThrow()
  expect(parseEnvironment({ VITE_APP_MODE: 'demo' }).VITE_ENABLE_AI).toBe(
    'false',
  )
  expect(
    parseEnvironment({ VITE_API_BASE_URL: 'https://example.test/api' })
      .VITE_APP_MODE,
  ).toBe('api')
  expect(() => parseEnvironment({ VITE_APP_MODE: 'typo' })).toThrow()
  expect(() => parseEnvironment({ VITE_API_BASE_URL: 'not-a-url' })).toThrow()
})

test('rejects API base URLs that cannot be safely joined to endpoint paths', () => {
  for (const url of [
    'file:///tmp/api',
    'ftp://example.test/api',
    'https://user:password@example.test/api',
    'https://example.test/api?token=public',
    'https://example.test/api#fragment',
  ])
    expect(() => parseEnvironment({ VITE_API_BASE_URL: url })).toThrow()
})
