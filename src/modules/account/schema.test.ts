import { expect, test } from 'vitest'
import { passwordRules, resetInput, safeRedirect } from './schema'

test('post-sign-in redirects stay on this application', () => {
  expect(safeRedirect('/requests?status=pending')).toBe(
    '/requests?status=pending',
  )
  for (const unsafe of [
    null,
    '',
    'https://evil.example',
    '//evil.example/path',
    '/\\evil.example',
    'javascript:alert(1)',
    '/sign-in',
    '/reset-password?token=x',
  ])
    expect(safeRedirect(unsafe)).toBe('/')
})

test('the password hint matches the reset form validation', () => {
  const strong = 'correct horse 42'
  expect(passwordRules.every((rule) => rule.test(strong))).toBe(true)
  expect(
    resetInput.safeParse({ token: 't', password: strong, confirm: strong })
      .success,
  ).toBe(true)
  expect(
    resetInput.safeParse({ token: 't', password: 'short1', confirm: 'short1' })
      .success,
  ).toBe(false)
  expect(
    resetInput.safeParse({ token: 't', password: strong, confirm: 'other' })
      .success,
  ).toBe(false)
})
