import { expect, test } from 'vitest'
import { withRequestHeaders } from './headers'

test('adds CSRF tokens to unsafe methods and a request ID to every call', async () => {
  document.cookie = 'XSRF-TOKEN=abc%20123'
  const seen: Request[] = []
  const transport = withRequestHeaders(
    async (request) => {
      seen.push(request)
      return new Response(null, { status: 204 })
    },
    {
      csrf: { cookie: 'XSRF-TOKEN', header: 'X-XSRF-TOKEN' },
      requestIdHeader: 'X-Request-Id',
    },
  )
  await transport(new Request('https://api.test/a'))
  await transport(new Request('https://api.test/a', { method: 'POST' }))
  expect(seen[0]!.headers.get('X-XSRF-TOKEN')).toBeNull()
  expect(seen[1]!.headers.get('X-XSRF-TOKEN')).toBe('abc 123')
  expect(seen[0]!.headers.get('X-Request-Id')).not.toBe(
    seen[1]!.headers.get('X-Request-Id'),
  )
})
