import { afterEach, expect, test } from 'vitest'
import '@/shared/i18n'
import { configureTimeZone, date, dateTime, getTimeZone } from './format'

afterEach(() => configureTimeZone(undefined))

test('dates follow the configured organization time zone', () => {
  // 22:30 UTC is already the next day in Riyadh (UTC+3).
  const iso = '2026-03-10T22:30:00Z'
  configureTimeZone('Asia/Riyadh')
  expect(date(iso)).toBe('Mar 11, 2026')
  expect(dateTime(iso)).toContain('1:30')
  configureTimeZone('America/New_York')
  expect(date(iso)).toBe('Mar 10, 2026')
})

test('invalid zones fall back to the browser', () => {
  configureTimeZone('Mars/Olympus')
  expect(getTimeZone()).toBeUndefined()
})
