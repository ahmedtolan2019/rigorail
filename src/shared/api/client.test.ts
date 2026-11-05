// @vitest-environment node
import { expect, test } from 'vitest'
import { z } from 'zod'
import { ApiClient } from './client'

test('validates successful, empty, malformed and non-2xx responses', async () => {
  const client = (response: Response) =>
    new ApiClient('https://example.test/api', async () => response)
  await expect(
    client(Response.json({ id: '1' })).request(
      '/items',
      z.object({ id: z.string() }),
    ),
  ).resolves.toEqual({ id: '1' })
  await expect(
    client(new Response(null, { status: 204 })).request(
      '/items',
      z.undefined(),
    ),
  ).resolves.toBeUndefined()
  await expect(
    client(new Response('{broken')).request('/items', z.unknown()),
  ).rejects.toMatchObject({ code: 'invalid_response' })
  await expect(
    client(Response.json({ id: 3 })).request(
      '/items',
      z.object({ id: z.string() }),
    ),
  ).rejects.toMatchObject({ code: 'invalid_response' })
  await expect(
    client(
      Response.json(
        { message: 'No access', code: 'forbidden' },
        { status: 403 },
      ),
    ).request('/items', z.unknown()),
  ).rejects.toMatchObject({ status: 403, code: 'forbidden' })
})
test('restricts destination and passes cancellation with credentials', async () => {
  const controller = new AbortController()
  const client = new ApiClient('https://example.test/api', async (request) => {
    expect(request.url).toBe('https://example.test/api/items')
    expect(request.credentials).toBe('include')
    controller.abort()
    request.signal.throwIfAborted()
    return Response.json({})
  })
  await expect(
    client.request('//other.test', z.unknown()),
  ).rejects.toMatchObject({ code: 'configuration' })
  await expect(
    client.request('/items', z.unknown(), { signal: controller.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' })
})

test('long operations can choose a timeout without changing normal request limits', async () => {
  const client = new ApiClient(
    'https://example.test',
    async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      request.signal.throwIfAborted()
      return Response.json({ ok: true })
    },
    5,
  )
  await expect(
    client.request('/slow', z.object({ ok: z.boolean() }), { timeoutMs: 1000 }),
  ).resolves.toEqual({ ok: true })
  await expect(client.request('/slow', z.unknown())).rejects.toMatchObject({
    name: 'TimeoutError',
  })
})
