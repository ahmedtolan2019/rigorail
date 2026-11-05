import { z } from 'zod'
import type { ApiClient } from '../api/client'
const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delta'), text: z.string().max(8000) }),
  z.object({ type: z.literal('done') }),
  z.object({ type: z.literal('error'), message: z.string() }),
])
export async function streamSuggestion(
  api: ApiClient,
  body: unknown,
  signal: AbortSignal,
  onText: (text: string) => void,
  options: { timeoutMs?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 120_000
  const streamSignal = AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
  const response = await api.response('/ai/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
    signal: streamSignal,
    timeoutMs,
    headers: { Accept: 'application/x-ndjson' },
  })
  if (!response.body) throw new Error('The stream was empty.')
  const reader = response.body.getReader()
  const abort = () => {
    void reader.cancel(streamSignal.reason).catch(() => undefined)
  }
  streamSignal.addEventListener('abort', abort, { once: true })
  const decoder = new TextDecoder()
  let buffer = '',
    text = '',
    complete = false
  function consume(line: string) {
    if (!line.trim()) return
    const event = eventSchema.parse(JSON.parse(line))
    if (event.type === 'error') throw new Error(event.message)
    if (event.type === 'done') {
      complete = true
      return
    }
    text += event.text
    if (text.length > 50_000)
      throw new Error('The suggestion exceeded its size limit.')
    onText(text)
  }
  try {
    while (!complete) {
      streamSignal.throwIfAborted()
      const { value, done } = await reader.read()
      streamSignal.throwIfAborted()
      buffer += decoder.decode(value, { stream: !done })
      if (buffer.length > 64_000) throw new Error('Invalid stream frame size.')
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        consume(line)
        if (complete) break
      }
      if (done) {
        if (buffer && !complete) consume(buffer)
        break
      }
    }
    if (!complete)
      throw new Error(
        'The stream ended before completion. Generate again to retry.',
      )
    return text
  } finally {
    streamSignal.removeEventListener('abort', abort)
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
