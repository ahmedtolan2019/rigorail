import { beforeEach, expect, test } from 'vitest'
import { createDemoIdentity, DEMO_MFA_CODE, DEMO_PASSWORD } from './identity'

const call = (
  identity: ReturnType<typeof createDemoIdentity>,
  path: string,
  method = 'GET',
  body?: unknown,
) =>
  identity.handle(
    new Request(`http://demo.local${path}`, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    path,
  )

beforeEach(() => sessionStorage.clear())

test('sign-out persists for the tab; sign-in and the second factor restore it', async () => {
  const identity = createDemoIdentity()
  expect(identity.signedIn).toBe(true)
  expect((await call(identity, '/auth/sign-out', 'POST'))!.status).toBe(204)
  expect(createDemoIdentity().signedIn).toBe(false)
  expect((await call(identity, '/account'))!.status).toBe(401)
  const wrong = await call(identity, '/auth/sign-in', 'POST', {
    email: 'sam@example.com',
    password: 'nope',
    remember: false,
  })
  expect(await wrong!.json()).toMatchObject({ code: 'invalid_credentials' })
  const mfa = await call(identity, '/auth/sign-in', 'POST', {
    email: 'sam+mfa@example.com',
    password: DEMO_PASSWORD,
    remember: true,
  })
  expect(await mfa!.json()).toEqual({ status: 'mfa_required' })
  expect(identity.signedIn).toBe(false)
  const code = await call(identity, '/auth/mfa', 'POST', {
    code: DEMO_MFA_CODE,
    remember: true,
  })
  expect(await code!.json()).toEqual({ status: 'signed_in' })
  expect(identity.signedIn).toBe(true)
})

test('repeated failures are rate limited and reset tokens can expire', async () => {
  const identity = createDemoIdentity()
  const attempt = () =>
    call(identity, '/auth/sign-in', 'POST', {
      email: 'sam@example.com',
      password: 'wrong',
      remember: false,
    })
  for (let index = 0; index < 5; index++) await attempt()
  expect((await attempt())!.status).toBe(429)
  const expired = await call(identity, '/auth/password/reset', 'POST', {
    token: 'old',
    password: 'a new password 1',
  })
  expect(expired!.status).toBe(410)
})

test('account devices: the current session stays, others can be revoked', async () => {
  const identity = createDemoIdentity()
  const list = async () =>
    (
      (await (await call(identity, '/account/sessions'))!.json()) as {
        items: { id: string; current: boolean }[]
      }
    ).items
  expect(
    (await call(identity, '/account/sessions/s-current', 'DELETE'))!.status,
  ).toBe(409)
  expect(
    (await call(identity, '/account/sessions/s-phone', 'DELETE'))!.status,
  ).toBe(204)
  expect(await list()).toHaveLength(2)
  await call(identity, '/account/sessions/revoke-others', 'POST')
  expect((await list()).map((item) => item.current)).toEqual([true])
  const changed = await call(identity, '/account/password', 'POST', {
    current: 'wrong',
    password: 'a new password 1',
  })
  expect(await changed!.json()).toMatchObject({
    fields: { current: 'incorrect' },
  })
})
