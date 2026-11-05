import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import type { ApiClient } from '@/shared/api/client'
import {
  accountSchema,
  accountSessionsSchema,
  signInResult,
  type PasswordChangeInput,
  type ResetInput,
  type SignInInput,
} from './schema'

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })

// Signed-out flows. The backend sets and clears the session cookie.
export const signIn = (api: ApiClient, input: SignInInput) =>
  api.request('/auth/sign-in', signInResult, json(input))
export const verifyMfa = (
  api: ApiClient,
  input: { code: string; remember: boolean },
) => api.request('/auth/mfa', signInResult, json(input))
/** Always succeeds for a well-formed email so accounts cannot be discovered. */
export const requestPasswordReset = (api: ApiClient, email: string) =>
  api.request('/auth/password/forgot', z.undefined(), json({ email }))
export const resetPassword = (
  api: ApiClient,
  { token, password }: ResetInput,
) =>
  api.request('/auth/password/reset', z.undefined(), json({ token, password }))

// Signed-in account management.
export const accountKeys = {
  all: (user: string) => ['account', user] as const,
  profile: (user: string) => ['account', user, 'profile'] as const,
  sessions: (user: string) => ['account', user, 'sessions'] as const,
}
export const accountOptions = (api: ApiClient, user: string) =>
  queryOptions({
    queryKey: accountKeys.profile(user),
    queryFn: ({ signal }) => api.request('/account', accountSchema, { signal }),
  })
export const sessionsOptions = (api: ApiClient, user: string) =>
  queryOptions({
    queryKey: accountKeys.sessions(user),
    queryFn: ({ signal }) =>
      api.request('/account/sessions', accountSessionsSchema, { signal }),
  })
export const updateProfile = (api: ApiClient, name: string) =>
  api.request('/account', accountSchema, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
export const changePassword = (
  api: ApiClient,
  { current, password }: PasswordChangeInput,
) =>
  api.request('/account/password', z.undefined(), json({ current, password }))
export const revokeSession = (api: ApiClient, id: string) =>
  api.request(`/account/sessions/${encodeURIComponent(id)}`, z.undefined(), {
    method: 'DELETE',
  })
export const revokeOtherSessions = (api: ApiClient) =>
  api.request('/account/sessions/revoke-others', z.undefined(), {
    method: 'POST',
  })
