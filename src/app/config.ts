// Application identity and defaults. Domain modules must not import this file.
export const appConfig = {
  id: 'rigorail',
  name: 'Rigorail',
  currency: 'USD',
  /** Your logo: an image in public/ (for example '/logo.svg'), or null for the default mark. */
  brand: {
    logoUrl: null as string | null,
    /**
     * Letterhead on printed documents (reports, records): legal name and contact
     * lines. Null prints the app name only.
     */
    letterhead: null as { organization: string; lines: string[] } | null,
  },
  /** Agree both with the backend before enabling; see docs/backend-contract.md. */
  api: {
    csrf: null as { cookie: string; header: string } | null,
    requestIdHeader: null as string | null,
    /** Server-Sent Events path for live updates, for example '/events'. */
    events: null as string | null,
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
