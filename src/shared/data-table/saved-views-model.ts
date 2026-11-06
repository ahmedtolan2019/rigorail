import { z } from 'zod'

/**
 * A saved table view: list search state plus column layout. The shape of `search`
 * belongs to the owning module, which validates it with its own schema on apply.
 */
export const savedViewState = z.object({
  search: z.record(z.string(), z.unknown()),
  columns: z
    .object({
      visibility: z.record(z.string(), z.boolean()).optional(),
      pinning: z
        .object({
          left: z.array(z.string()).optional(),
          right: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
})
export type SavedViewState = z.infer<typeof savedViewState>
export const savedViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: savedViewState,
})
export type SavedView = z.infer<typeof savedViewSchema>
export const savedViewsSchema = z.object({ items: z.array(savedViewSchema) })

/** Order-independent comparison, so a view stays "active" after equivalent edits. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) => `${key}:${canonical((value as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`
  return JSON.stringify(value)
}
