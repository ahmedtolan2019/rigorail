/**
 * Identifies the running build in error reports and analytics, so a failure can be
 * tied to a deploy. Set VITE_APP_RELEASE in CI (for example the commit SHA).
 */
export const release: string = import.meta.env.VITE_APP_RELEASE || 'development'
