import {
  loadAccountContract,
  type AccountSession,
} from '@/modules/account/public'

/**
 * In-memory stand-in for the external identity backend. It exists so the sign-in,
 * account and sign-out screens are runnable; it is not an authentication design.
 * Demo credentials are documented in README.md and shown on the demo sign-in page.
 */
export const DEMO_PASSWORD = 'demo-password-1'
export const DEMO_MFA_CODE = '123456'
const STORAGE_KEY = 'demo:signed-out'
const MAX_ATTEMPTS = 5
const HOUR = 3_600_000

const json = (body: unknown, status = 200) => Response.json(body, { status })
const empty = () => new Response(null, { status: 204 })
const fail = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) => json({ message, code, ...(fields ? { fields } : {}) }, status)

function readSignedIn() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== '1'
  } catch {
    return true
  }
}
function persist(signedIn: boolean) {
  try {
    if (signedIn) sessionStorage.removeItem(STORAGE_KEY)
    else sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* The demo still works for this page load. */
  }
}

export function createDemoIdentity() {
  // Signed in by default so the demo opens on the workspace; sign out to try the flows.
  let signedIn = readSignedIn(),
    mfaPending = false,
    failures = 0,
    password = DEMO_PASSWORD
  const account = {
    name: 'Sam Taylor',
    email: 'sam.taylor@example.com',
    mfaEnabled: false,
    passwordChangedAt: new Date(Date.now() - 96 * 24 * HOUR).toISOString(),
    passwordManaged: false,
  }
  let sessions: AccountSession[] = [
    {
      id: 's-current',
      device: 'desktop',
      client: 'Chrome on macOS',
      location: 'Riyadh, SA',
      lastActiveAt: new Date().toISOString(),
      current: true,
    },
    {
      id: 's-phone',
      device: 'mobile',
      client: 'Safari on iPhone',
      location: 'Riyadh, SA',
      lastActiveAt: new Date(Date.now() - 3 * HOUR).toISOString(),
      current: false,
    },
    {
      id: 's-office',
      device: 'desktop',
      client: 'Edge on Windows',
      location: 'Dubai, AE',
      lastActiveAt: new Date(Date.now() - 50 * HOUR).toISOString(),
      current: false,
    },
  ]
  function setSignedIn(value: boolean) {
    signedIn = value
    mfaPending = false
    persist(value)
  }
  const body = async (request: Request) => request.json().catch(() => null)

  /** Returns a response for identity endpoints, or null for other paths. */
  async function handle(
    request: Request,
    path: string,
  ): Promise<Response | null> {
    if (!path.startsWith('/auth/') && !path.startsWith('/account')) return null
    const {
      forgotInput,
      mfaInput,
      passwordChangeInput,
      profileInput,
      resetInput,
      signInInput,
    } = await loadAccountContract()
    const method = request.method
    if (path === '/auth/sign-in' && method === 'POST') {
      if (failures >= MAX_ATTEMPTS)
        return fail(429, 'rate_limited', 'Too many attempts. Try again later.')
      const parsed = signInInput.safeParse(await body(request))
      if (!parsed.success || parsed.data.password !== password) {
        failures++
        return fail(
          401,
          'invalid_credentials',
          'Email or password is incorrect.',
        )
      }
      failures = 0
      // Any address containing "+mfa" demonstrates the second-factor step.
      if (parsed.data.email.includes('+mfa')) {
        mfaPending = true
        return json({ status: 'mfa_required' })
      }
      setSignedIn(true)
      return json({ status: 'signed_in' })
    }
    if (path === '/auth/mfa' && method === 'POST') {
      if (!mfaPending)
        return fail(401, 'mfa_expired', 'Start signing in again.')
      const parsed = mfaInput.safeParse(await body(request))
      if (!parsed.success || parsed.data.code !== DEMO_MFA_CODE)
        return fail(401, 'invalid_code', 'The code is incorrect.')
      setSignedIn(true)
      return json({ status: 'signed_in' })
    }
    if (path === '/auth/sso/demo' && method === 'POST') {
      setSignedIn(true)
      return json({ status: 'signed_in' })
    }
    if (path === '/auth/password/forgot' && method === 'POST') {
      if (!forgotInput.safeParse(await body(request)).success)
        return fail(422, 'validation', 'Enter a valid email.')
      return empty()
    }
    if (path === '/auth/password/reset' && method === 'POST') {
      const input = (await body(request)) as {
        token?: string
        password?: string
      } | null
      const parsed = resetInput.safeParse({
        ...input,
        confirm: input?.password,
      })
      // The demo reset link uses token "demo"; any other token is treated as expired.
      if (input?.token !== 'demo')
        return fail(410, 'expired_token', 'This link has expired.')
      if (!parsed.success)
        return fail(422, 'validation', 'Choose a stronger password.', {
          password: 'policy',
        })
      password = parsed.data.password
      account.passwordChangedAt = new Date().toISOString()
      return empty()
    }
    if (path === '/auth/sign-out' && method === 'POST') {
      setSignedIn(false)
      return empty()
    }
    if (!path.startsWith('/account')) return null
    if (!signedIn) return fail(401, 'unauthenticated', 'Sign in to continue.')
    if (path === '/account' && method === 'GET') return json(account)
    if (path === '/account' && method === 'PATCH') {
      const parsed = profileInput.safeParse(await body(request))
      if (!parsed.success)
        return fail(422, 'validation', 'Check the name.', { name: 'invalid' })
      account.name = parsed.data.name
      return json(account)
    }
    if (path === '/account/password' && method === 'POST') {
      const input = (await body(request)) as {
        current?: string
        password?: string
      } | null
      if (input?.current !== password)
        return fail(422, 'validation', 'The current password is incorrect.', {
          current: 'incorrect',
        })
      const parsed = passwordChangeInput.safeParse({
        ...input,
        confirm: input.password,
      })
      if (!parsed.success)
        return fail(422, 'validation', 'Choose a stronger password.', {
          password: 'policy',
        })
      password = parsed.data.password
      account.passwordChangedAt = new Date().toISOString()
      return empty()
    }
    if (path === '/account/sessions' && method === 'GET')
      return json({ items: sessions })
    if (path === '/account/sessions/revoke-others' && method === 'POST') {
      sessions = sessions.filter((session) => session.current)
      return empty()
    }
    const match = path.match(/^\/account\/sessions\/([^/]+)$/)
    if (match && method === 'DELETE') {
      const id = decodeURIComponent(match[1]!)
      const target = sessions.find((session) => session.id === id)
      if (!target) return fail(404, 'not_found', 'Session not found.')
      if (target.current)
        return fail(409, 'current_session', 'Sign out to end this session.')
      sessions = sessions.filter((session) => session.id !== id)
      return empty()
    }
    return null
  }
  return {
    handle,
    get signedIn() {
      return signedIn
    },
    get user() {
      return { name: account.name, email: account.email }
    },
  }
}
