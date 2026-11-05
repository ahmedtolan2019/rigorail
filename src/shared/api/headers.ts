import type { Transport } from './client'

export interface RequestHeaderOptions {
  /**
   * Double-submit CSRF: copy a readable cookie into a header on unsafe methods.
   * Use only if the backend issues such a cookie; HttpOnly session cookies stay unread.
   */
  csrf?: { cookie: string; header: string } | null
  /** Sends a fresh correlation ID per request (the backend must allow it in CORS). */
  requestIdHeader?: string | null
}

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix))
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined
}

/** Wraps a transport with the agreed CSRF and correlation headers. */
export function withRequestHeaders(
  transport: Transport,
  { csrf, requestIdHeader }: RequestHeaderOptions,
): Transport {
  if (!csrf && !requestIdHeader) return transport
  return (request) => {
    const headers = new Headers(request.headers)
    if (requestIdHeader) headers.set(requestIdHeader, crypto.randomUUID())
    if (csrf && !SAFE.has(request.method)) {
      const token = readCookie(csrf.cookie)
      if (token) headers.set(csrf.header, token)
    }
    return transport(new Request(request, { headers }))
  }
}
