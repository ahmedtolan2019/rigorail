// Plain values with no schema dependency, so the entry bundle can import them.

/** Paths served by the signed-out experience. */
export const authPaths = {
  signIn: '/sign-in',
  forgot: '/forgot-password',
  reset: '/reset-password',
} as const

/**
 * Only same-origin application paths are accepted as post-sign-in targets, so a
 * crafted `?redirect=` cannot send users to another site.
 */
export function safeRedirect(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return '/'
  if (Object.values(authPaths).some((path) => value.startsWith(path)))
    return '/'
  return value
}
