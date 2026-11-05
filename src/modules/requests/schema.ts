import { z } from 'zod'

export const requestStatuses = ['draft', 'pending', 'approved'] as const
export const requestStatus = z.enum(requestStatuses)
export const requestCategories = [
  'equipment',
  'software',
  'training',
  'services',
  'facilities',
] as const
export const requestCategory = z.enum(requestCategories)

export const requestInput = z.object({
  title: z.string().trim().min(3, 'Use at least 3 characters.').max(120),
  category: requestCategory,
  description: z.string().trim().max(4000),
  amount: z
    .string()
    .regex(
      /^\d{1,7}(\.\d{1,2})?$/,
      'Enter a positive amount with at most 2 decimals.',
    )
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero.'),
})
export type RequestInput = z.infer<typeof requestInput>
export const requestSchema = z.object({
  /** Internal identifier for URLs and API calls. Never shown to users. */
  id: z.string(),
  /** Human-readable business reference (for example REQ-1042) shown in the UI. */
  reference: z.string(),
  title: z.string(),
  description: z.string(),
  category: requestCategory,
  amountMinor: z.number().int().positive(),
  status: requestStatus,
  ownerId: z.string(),
  ownerName: z.string(),
  workspaceId: z.string(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type RequestRecord = z.infer<typeof requestSchema>

const counts = <T extends z.ZodEnum>(keys: T) =>
  z.record(keys, z.number().int().nonnegative())
/** Facet counts apply every active filter except the facet's own, so options stay discoverable. */
export const requestExportSchema = z.object({
  items: z.array(requestSchema),
  total: z.number().int().nonnegative(),
  truncated: z.boolean(),
})
export const requestListSchema = z.object({
  items: z.array(requestSchema),
  total: z.number().int().nonnegative(),
  facets: z.object({
    status: counts(requestStatus),
    category: counts(requestCategory),
    owner: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        count: z.number().int().nonnegative(),
      }),
    ),
    /** Owners with matching records; `owner` lists only the top ones plus any selected. */
    ownerTotal: z.number().int().nonnegative(),
  }),
})
export const ownerSearchSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
})
export type RequestList = z.infer<typeof requestListSchema>

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)
export const PAGE_SIZES = [10, 20, 50] as const
/** Server cap for one export; larger exports belong in a backend job. */
export const EXPORT_LIMIT = 5000
export const requestSorts = [
  'updated',
  'created',
  'title',
  'amount',
  'status',
  'owner',
] as const
export const requestFilter = z.object({
  q: z.string().trim().max(120).catch(''),
  status: z.array(requestStatus).max(3).catch([]),
  category: z.array(requestCategory).max(5).catch([]),
  owner: z.array(z.string().max(64)).max(20).catch([]),
  /** Inclusive created-date range as yyyy-mm-dd. */
  from: isoDate,
  to: isoDate,
})
export type RequestFilter = z.infer<typeof requestFilter>
export const requestSearch = requestFilter.extend({
  sort: z.enum(requestSorts).catch('updated'),
  dir: z.enum(['asc', 'desc']).catch('desc'),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  size: z.coerce
    .number()
    .refine((value) => (PAGE_SIZES as readonly number[]).includes(value))
    .catch(PAGE_SIZES[0]),
})
export type RequestSearch = z.infer<typeof requestSearch>
export const defaultRequestSearch = requestSearch.parse({})

/** Serializes search state for the API: repeated keys for lists, defaults omitted. */
export function toRequestQuery(search: Partial<RequestSearch>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) for (const item of value) query.append(key, item)
    else if (
      value !== undefined &&
      value !== '' &&
      value !== defaultRequestSearch[key as keyof RequestSearch]
    )
      query.set(key, String(value))
  }
  return query
}
/** Parses the API query string produced by `toRequestQuery`. */
export function fromRequestQuery(query: URLSearchParams) {
  return requestSearch.parse({
    ...Object.fromEntries(query),
    status: query.getAll('status'),
    category: query.getAll('category'),
    owner: query.getAll('owner'),
  })
}

export const bulkActions = ['submit', 'approve'] as const
export const bulkCommand = z.object({
  action: z.enum(bulkActions),
  target: z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('ids'),
      ids: z.array(z.string()).min(1).max(500),
    }),
    z.object({
      mode: z.literal('all'),
      filter: requestFilter,
      excluded: z.array(z.string()).max(500),
    }),
  ]),
})
export type BulkCommand = z.infer<typeof bulkCommand>
export const bulkResult = z.object({
  succeeded: z.array(z.string()),
  failed: z.array(
    z.object({
      id: z.string(),
      code: z.enum(['forbidden', 'conflict', 'not_found']),
    }),
  ),
})

export function toMinorUnits(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
