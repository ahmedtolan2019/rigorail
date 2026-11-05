import type { TFunction } from 'i18next'
import { ApiError } from '@/shared/api/client'
import { errorFeedback } from '@/shared/api/error-feedback'
import type { authPaths } from '../schema'

export type AuthPath = (typeof authPaths)[keyof typeof authPaths]
export type Notice = 'expired' | 'signed-out' | 'reset'
/** Navigation inside the signed-out experience; it does not use the app router. */
export type Go = (path: AuthPath, search?: Record<string, string>) => void

/** Maps identity errors to translated text. Never shows backend wording. */
export function authErrorMessage(error: unknown, t: TFunction) {
  if (error instanceof ApiError) {
    const known: Record<string, string> = {
      invalid_credentials: 'invalidCredentials',
      invalid_code: 'invalidCode',
      mfa_expired: 'mfaExpired',
      rate_limited: 'rateLimitedAuth',
    }
    if (known[error.code]) return t(known[error.code]!)
    if (error.status === 429) return t('rateLimitedAuth')
  }
  return t(errorFeedback(error).message)
}
