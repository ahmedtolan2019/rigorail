// @vitest-environment node
import { expect, test } from 'vitest'
import { ApiClient } from '../api/client'
import { streamSuggestion } from './stream'
function client(parts: string[]) {
  return new ApiClient(
    'https://example.test',
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            for (const part of parts)
              controller.enqueue(new TextEncoder().encode(part))
            controller.close()
          },
        }),
      ),
  )
}
test('parses split NDJSON frames, rejects truncation and server errors', async () => {
  const updates: string[] = [],
    signal = new AbortController().signal
  await expect(
    streamSuggestion(
      client(['{"type":"del', 'ta","text":"مرحبا"}\n', '{"type":"done"}\n']),
      {},
      signal,
      (text) => updates.push(text),
    ),
  ).resolves.toBe('مرحبا')
  expect(updates).toEqual(['مرحبا'])
  await expect(
    streamSuggestion(
      client(['{"type":"delta","text":"partial"}\n']),
      {},
      signal,
      () => undefined,
    ),
  ).rejects.toThrow('before completion')
  await expect(
    streamSuggestion(
      client(['{"type":"error","message":"failed"}\n']),
      {},
      signal,
      () => undefined,
    ),
  ).rejects.toThrow('failed')
})
test('does not apply cancelled streams', async () => {
  const controller = new AbortController()
  controller.abort()
  await expect(
    streamSuggestion(
      client(['{"type":"done"}\n']),
      {},
      controller.signal,
      () => {
        throw new Error('Should not publish text')
      },
    ),
  ).rejects.toMatchObject({ name: 'AbortError' })
})

test('a stalled response body times out and cancels its reader', async () => {
  let cancelled = false
  const api = new ApiClient(
    'https://example.test',
    async () =>
      new Response(
        new ReadableStream({
          cancel() {
            cancelled = true
          },
        }),
      ),
  )
  await expect(
    streamSuggestion(api, {}, new AbortController().signal, () => undefined, {
      timeoutMs: 20,
    }),
  ).rejects.toMatchObject({ name: 'TimeoutError' })
  expect(cancelled).toBe(true)
})
