import { expect, test } from 'vitest'
import { matches } from './registry'

const press = (key: string, init: KeyboardEventInit = {}) =>
  new KeyboardEvent('keydown', { key, ...init })

test('mod maps to Command on Apple and Ctrl elsewhere', () => {
  expect(matches(press('k', { metaKey: true }), 'mod+k', true)).toBe(true)
  expect(matches(press('k', { ctrlKey: true }), 'mod+k', true)).toBe(false)
  expect(matches(press('k', { ctrlKey: true }), 'mod+k', false)).toBe(true)
  expect(matches(press('k'), 'mod+k', false)).toBe(false)
})

test('plain keys reject modifiers; symbols accept their implied Shift', () => {
  expect(matches(press('n'), 'n', false)).toBe(true)
  expect(matches(press('N', { shiftKey: true }), 'n', false)).toBe(false)
  expect(matches(press('n', { ctrlKey: true }), 'n', false)).toBe(false)
  expect(matches(press('?', { shiftKey: true }), '?', false)).toBe(true)
  expect(matches(press('/'), '/', false)).toBe(true)
})

test('the slash key works on non-English layouts', () => {
  expect(
    matches(press('؟', { code: 'Slash', shiftKey: true }), '?', false),
  ).toBe(true)
  expect(matches(press('ظ', { code: 'Slash' }), '/', false)).toBe(true)
  expect(matches(press('ظ', { code: 'Slash' }), '?', false)).toBe(false)
})
