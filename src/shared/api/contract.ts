import type { Capabilities } from '../capabilities/model'
import type { BusinessConfiguration } from '../config/business'
import type { Session } from '../auth/model'
import type { SavedView } from '../data-table/saved-views-model'
import type { Attachment, UploadTicket } from '../uploads/model'
import type { components } from './openapi.gen'

/**
 * Compile-time contract checks. `openapi.gen.ts` is generated from
 * `contracts/openapi.yaml` (`npm run api:types`); Zod schemas stay the runtime
 * validators. Each owner asserts its Zod output matches the spec both ways, so a
 * spec change that the frontend has not absorbed fails `npm run typecheck`.
 */
export type ApiSchema<Name extends keyof components['schemas']> =
  components['schemas'][Name]
export type Matches<Zod, Spec> = [Zod] extends [Spec]
  ? [Spec] extends [Zod]
    ? true
    : false
  : false
export type Expect<Value extends true> = Value

export type SharedContract = [
  Expect<Matches<Session, ApiSchema<'Session'>>>,
  Expect<Matches<Capabilities, ApiSchema<'Capabilities'>>>,
  Expect<Matches<BusinessConfiguration, ApiSchema<'Configuration'>>>,
  Expect<Matches<SavedView, ApiSchema<'SavedView'>>>,
  Expect<Matches<Attachment, ApiSchema<'Attachment'>>>,
  Expect<Matches<UploadTicket, ApiSchema<'UploadTicket'>>>,
]
