import { afterEach, expect, test, vi } from 'vitest'
import { invalidationsFor, serverSentEvents } from './events'

afterEach(() => vi.unstubAllGlobals())

test('an event refreshes every module that subscribes to its topic', () => {
  const modules = [
    { id: 'requests', refreshOn: ['requests'] },
    { id: 'reports', refreshOn: ['requests', 'budgets'] },
    { id: 'appearance' },
  ]
  expect(invalidationsFor(modules, { topic: 'requests' })).toEqual([
    ['requests'],
    ['reports'],
  ])
  expect(invalidationsFor(modules, { topic: 'budgets' })).toEqual([['reports']])
  expect(invalidationsFor(modules, { topic: 'unknown' })).toEqual([])
})

test('server-sent events validate frames and close on unsubscribe', () => {
  const instances: {
    onmessage?: (m: { data: string }) => void
    close: () => void
    init: unknown
  }[] = []
  vi.stubGlobal(
    'EventSource',
    class {
      onmessage?: (m: { data: string }) => void
      close = vi.fn()
      constructor(
        readonly url: string,
        readonly init: unknown,
      ) {
        instances.push(this)
      }
    },
  )
  const listener = vi.fn()
  const stop = serverSentEvents('https://api.test/events')(listener)
  const source = instances[0]!
  expect(source.init).toEqual({ withCredentials: true })
  source.onmessage!({ data: '{"topic":"requests","ids":["1"]}' })
  source.onmessage!({ data: 'not json' })
  source.onmessage!({ data: '{"nope":true}' })
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith({ topic: 'requests', ids: ['1'] })
  stop()
  expect(source.close).toHaveBeenCalled()
})
