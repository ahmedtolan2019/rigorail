import type { z } from 'zod'
import type { ApiSchema, Expect, Matches } from '@/shared/api/contract'
import type {
  Account,
  AccountSession,
  accountSessionsSchema,
  signInResult,
} from './schema'

// Fails typecheck when contracts/openapi.yaml and these schemas disagree.
export type AccountContract = [
  Expect<Matches<Account, ApiSchema<'Account'>>>,
  Expect<Matches<AccountSession, ApiSchema<'AccountSession'>>>,
  Expect<
    Matches<z.infer<typeof accountSessionsSchema>, ApiSchema<'AccountSessions'>>
  >,
  Expect<
    Matches<
      z.infer<typeof signInResult>['status'],
      ApiSchema<'SignInResult'>['status']
    >
  >,
]
