import type { ApiSchema, Expect, Matches } from '@/shared/api/contract'
import type { RequestInput, RequestList, RequestRecord } from './schema'

// Fails typecheck when contracts/openapi.yaml and these schemas disagree.
export type RequestsContract = [
  Expect<Matches<RequestRecord, ApiSchema<'RequestRecord'>>>,
  Expect<Matches<RequestList, ApiSchema<'RequestList'>>>,
  Expect<Matches<RequestInput, ApiSchema<'RequestInput'>>>,
]
