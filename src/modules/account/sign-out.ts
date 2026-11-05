import type { ApiClient } from '@/shared/api/client'

/** Ends the backend session. Kept tiny because the eager account menu needs it. */
export async function signOutRequest(api: ApiClient) {
  await api.response('/auth/sign-out', { method: 'POST' })
}
