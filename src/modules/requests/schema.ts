import { z } from 'zod'
export const requestStatus = z.enum(['draft', 'pending', 'approved'])
export const requestInput = z.object({
  title: z.string().trim().min(3, 'Use at least 3 characters.').max(120),
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
  id: z.string(),
  title: z.string(),
  description: z.string(),
  amountMinor: z.number().int().positive(),
  status: requestStatus,
  ownerId: z.string(),
  ownerName: z.string(),
  workspaceId: z.string(),
  version: z.number().int(),
  updatedAt: z.string().datetime(),
})
export type RequestRecord = z.infer<typeof requestSchema>
export const requestListSchema = z.object({
  items: z.array(requestSchema),
  total: z.number().int().nonnegative(),
})
export const requestSearch = z.object({
  q: z.string().max(120).catch(''),
  status: z.enum(['all', 'draft', 'pending', 'approved']).catch('all'),
  page: z.coerce.number().int().min(1).catch(1),
  sort: z.enum(['updated', 'title', 'amount']).catch('updated'),
})
export type RequestSearch = z.infer<typeof requestSearch>
export const PAGE_SIZE = 6
export function toMinorUnits(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
