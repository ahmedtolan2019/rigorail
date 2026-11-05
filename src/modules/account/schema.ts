import { z } from 'zod'

// Sample contract for the external identity/session backend (docs/backend-contract.md).
// The backend owns credentials, cookies, MFA, lockout and password policy. These
// schemas validate what the browser sends and receives; they are not security.

/** Frontend hint only. The backend enforces the real password policy. */
export const PASSWORD_MIN = 12
export const passwordRules = [
  { key: 'ruleLength', test: (value: string) => value.length >= PASSWORD_MIN },
  { key: 'ruleLetter', test: (value: string) => /\p{L}/u.test(value) },
  { key: 'ruleNumber', test: (value: string) => /\d/.test(value) },
] as const
const newPassword = z
  .string()
  .refine((value) => passwordRules.every((rule) => rule.test(value)))

export const signInInput = z.object({
  email: z.email(),
  password: z.string().min(1),
  remember: z.boolean(),
})
export type SignInInput = z.infer<typeof signInInput>
/** A sign-in either completes or asks for a second factor. */
export const signInResult = z.discriminatedUnion('status', [
  z.object({ status: z.literal('signed_in') }),
  z.object({ status: z.literal('mfa_required') }),
])
export const mfaInput = z.object({
  code: z.string().regex(/^\d{6}$/),
  remember: z.boolean(),
})
export const forgotInput = z.object({ email: z.email() })
export const resetInput = z
  .object({
    token: z.string().min(1),
    password: newPassword,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, { path: ['confirm'] })
export type ResetInput = z.infer<typeof resetInput>

export const accountSchema = z.object({
  name: z.string(),
  email: z.string(),
  /** Whether the identity provider requires a second factor for this user. */
  mfaEnabled: z.boolean(),
  passwordChangedAt: z.iso.datetime().nullable(),
  /** False when an external identity provider (SSO) manages the password. */
  passwordManaged: z.boolean(),
})
export type Account = z.infer<typeof accountSchema>
export const profileInput = z.object({ name: z.string().trim().min(2).max(80) })
export const passwordChangeInput = z
  .object({
    current: z.string().min(1),
    password: newPassword,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, { path: ['confirm'] })
export type PasswordChangeInput = z.infer<typeof passwordChangeInput>

export const accountSessionSchema = z.object({
  id: z.string(),
  device: z.enum(['desktop', 'mobile', 'tablet']),
  /** Display label from the backend, for example "Chrome on macOS". */
  client: z.string(),
  location: z.string().nullable(),
  lastActiveAt: z.iso.datetime(),
  current: z.boolean(),
})
export const accountSessionsSchema = z.object({
  items: z.array(accountSessionSchema),
})
export type AccountSession = z.infer<typeof accountSessionSchema>

export { authPaths, safeRedirect } from './paths'
