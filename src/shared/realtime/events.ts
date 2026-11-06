import { z } from 'zod'
import type { ModuleDefinition } from '../routing/module'

/**
 * A server notification that data changed. Topics name business resources
 * (`requests`), not screens; the payload carries no data, only what to refresh.
 */
export const realtimeEvent = z.object({
  topic: z.string().min(1),
  ids: z.array(z.string()).optional(),
})
export type RealtimeEvent = z.infer<typeof realtimeEvent>
/** Subscribes to change events; returns an unsubscribe function. */
export type RealtimeSource = (
  listener: (event: RealtimeEvent) => void,
) => () => void

/**
 * Query key prefixes to invalidate for an event. Each module's query keys start
 * with its id, and `refreshOn` lists the topics that make them stale.
 */
export function invalidationsFor(
  modules: readonly Pick<ModuleDefinition, 'id' | 'refreshOn'>[],
  event: RealtimeEvent,
) {
  return modules
    .filter((module) => module.refreshOn?.includes(event.topic))
    .map((module) => [module.id] as const)
}

/**
 * Server-Sent Events from the external API (`GET {base}/events`, cookie session).
 * The browser reconnects automatically; malformed messages are ignored.
 */
export function serverSentEvents(url: string): RealtimeSource {
  return (listener) => {
    const source = new EventSource(url, { withCredentials: true })
    source.onmessage = (message: MessageEvent<string>) => {
      try {
        const parsed = realtimeEvent.safeParse(JSON.parse(message.data))
        if (parsed.success) listener(parsed.data)
      } catch {
        /* Ignore frames that are not JSON. */
      }
    }
    return () => source.close()
  }
}
