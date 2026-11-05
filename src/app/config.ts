// Application identity and defaults. Domain modules must not import this file.
export const appConfig = {
  id: 'foundation',
  name: 'Foundation',
  currency: 'USD',
  /** Agree both with the backend before enabling; see docs/backend-contract.md. */
  api: {
    csrf: null as { cookie: string; header: string } | null,
    requestIdHeader: null as string | null,
  },
  auth: {
    /** Offer "Continue with single sign-on" on the sign-in page. */
    sso: true,
  },
  defaults: {
    brand: 'teal' as const,
    density: 'comfortable' as const,
    shell: 'sidebar' as const,
  },
}
